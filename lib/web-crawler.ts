import { load } from 'cheerio';

export interface CrawledPage {
  url: string;
  pageTitle: string | null;
  textContent: string;
  htmlContent: string;
  contentLength: number;
}

export interface CrawlResult {
  pages: CrawledPage[];
  totalDiscovered: number;
  errors: string[];
}

/**
 * Extracts the base domain from a URL
 */
function getBaseDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.origin;
  } catch (error) {
    return '';
  }
}

/**
 * Normalizes a URL (removes fragments, sorts query params)
 */
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove fragment
    urlObj.hash = '';
    // Sort query parameters for consistency
    urlObj.searchParams.sort();
    return urlObj.toString();
  } catch (error) {
    return url;
  }
}

/**
 * Checks if URL belongs to the same domain
 */
function isSameDomain(url: string, baseDomain: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.origin === baseDomain;
  } catch (error) {
    return false;
  }
}

/**
 * Fetches and parses sitemap.xml
 */
async function fetchSitemap(websiteUrl: string): Promise<string[]> {
  const sitemapUrls: string[] = [];
  
  try {
    const baseDomain = getBaseDomain(websiteUrl);
    const sitemapUrl = `${baseDomain}/sitemap.xml`;
    
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CMSKnowledgeBot/1.0)',
      },
    });
    
    if (!response.ok) {
      console.log(`Sitemap not found at ${sitemapUrl}`);
      return [];
    }
    
    const xml = await response.text();
    
    // Parse XML to extract URLs
    const $ = load(xml, { xmlMode: true });
    
    // Handle standard sitemap format
    $('url > loc').each((_, element) => {
      const url = $(element).text().trim();
      if (url && isSameDomain(url, baseDomain)) {
        sitemapUrls.push(normalizeUrl(url));
      }
    });
    
    // Handle sitemap index format
    $('sitemap > loc').each((_, element) => {
      const url = $(element).text().trim();
      if (url && isSameDomain(url, baseDomain)) {
        sitemapUrls.push(normalizeUrl(url));
      }
    });
    
    console.log(`Found ${sitemapUrls.length} URLs in sitemap`);
    
  } catch (error) {
    console.error('Error fetching sitemap:', error);
  }
  
  return sitemapUrls;
}

/**
 * Extracts all internal links from a page
 */
function extractLinks(html: string, baseUrl: string, baseDomain: string): string[] {
  const links: string[] = [];
  
  try {
    const $ = load(html);
    
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      
      try {
        // Resolve relative URLs
        const absoluteUrl = new URL(href, baseUrl).toString();
        
        // Only include same-domain URLs
        if (isSameDomain(absoluteUrl, baseDomain)) {
          // Exclude common non-content URLs
          const url = new URL(absoluteUrl);
          const pathname = url.pathname.toLowerCase();
          
          // Skip binary files and common excludes
          if (
            pathname.endsWith('.pdf') ||
            pathname.endsWith('.jpg') ||
            pathname.endsWith('.jpeg') ||
            pathname.endsWith('.png') ||
            pathname.endsWith('.gif') ||
            pathname.endsWith('.zip') ||
            pathname.endsWith('.xml') ||
            pathname.includes('/wp-admin') ||
            pathname.includes('/admin') ||
            pathname.includes('/login')
          ) {
            return;
          }
          
          links.push(normalizeUrl(absoluteUrl));
        }
      } catch (error) {
        // Invalid URL, skip
      }
    });
  } catch (error) {
    console.error('Error extracting links:', error);
  }
  
  return links;
}

/**
 * Crawls a single page and extracts its content
 */
async function crawlPage(url: string, baseDomain: string): Promise<CrawledPage | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CMSKnowledgeBot/1.0)',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      console.log(`Skipping non-HTML content: ${url}`);
      return null;
    }
    
    const htmlContent = await response.text();
    const $ = load(htmlContent);
    
    // Extract page title
    const pageTitle = $('title').text().trim() || null;
    
    // Remove script, style, and other non-content elements
    $('script, style, nav, header, footer, iframe, noscript').remove();
    
    // Extract visible text content
    const textContent = $('body').text()
      .replace(/\s+/g, ' ')
      .trim();
    
    return {
      url,
      pageTitle,
      textContent,
      htmlContent,
      contentLength: textContent.length,
    };
    
  } catch (error) {
    console.error(`Error crawling ${url}:`, error);
    return null;
  }
}

/**
 * Main crawl function
 */
export async function crawlWebsite(
  websiteUrl: string,
  options: {
    maxPages?: number;
    maxDepth?: number;
  } = {}
): Promise<CrawlResult> {
  const maxPages = options.maxPages || 100;
  const maxDepth = options.maxDepth || 3;
  
  const baseDomain = getBaseDomain(websiteUrl);
  const normalizedStartUrl = normalizeUrl(websiteUrl);
  
  const discovered = new Set<string>();
  const crawled = new Set<string>();
  const pages: CrawledPage[] = [];
  const errors: string[] = [];
  
  // Try to fetch sitemap first
  console.log('Attempting to fetch sitemap...');
  const sitemapUrls = await fetchSitemap(websiteUrl);
  
  if (sitemapUrls.length > 0) {
    console.log(`Using sitemap with ${sitemapUrls.length} URLs`);
    sitemapUrls.forEach(url => discovered.add(url));
  } else {
    console.log('No sitemap found, starting from homepage');
    discovered.add(normalizedStartUrl);
  }
  
  // BFS crawling
  const queue: Array<{ url: string; depth: number }> = [];
  discovered.forEach(url => queue.push({ url, depth: 0 }));
  
  while (queue.length > 0 && pages.length < maxPages) {
    const { url, depth } = queue.shift()!;
    
    if (crawled.has(url) || depth > maxDepth) {
      continue;
    }
    
    console.log(`Crawling (${pages.length + 1}/${maxPages}): ${url}`);
    
    const pageData = await crawlPage(url, baseDomain);
    
    if (pageData) {
      pages.push(pageData);
      crawled.add(url);
      
      // Extract links if we haven't reached max depth
      if (depth < maxDepth && sitemapUrls.length === 0) {
        const links = extractLinks(pageData.htmlContent, url, baseDomain);
        
        links.forEach(link => {
          if (!discovered.has(link) && !crawled.has(link)) {
            discovered.add(link);
            queue.push({ url: link, depth: depth + 1 });
          }
        });
      }
    } else {
      errors.push(`Failed to crawl: ${url}`);
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`Crawl completed: ${pages.length} pages crawled, ${discovered.size} total discovered`);
  
  return {
    pages,
    totalDiscovered: discovered.size,
    errors,
  };
}
