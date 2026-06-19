import { load } from 'cheerio';

export interface CrawledPage {
  url: string;
  pageTitle: string | null;
  textContent: string;
  htmlContent: string;
  contentLength: number;
  media: CrawledMedia[];
}

export interface CrawledMedia {
  type: 'image' | 'pdf' | 'video';
  mediaUrl: string;
  altText?: string;
  caption?: string;
  title?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
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
 * Extracts media (images, PDFs, videos) from HTML
 */
/**
 * Extract surrounding text from image's parent elements for improved metadata
 */
function getSurroundingText($img: any, $: any, maxWords: number = 30): string {
  const contextSelectors = ['p', 'li', 'td', 'th', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const parts: string[] = [];

  // Check parent elements up to 3 levels
  let $parent = $img.parent();
  for (let level = 0; level < 3 && $parent.length > 0; level++) {
    const tagName = ($parent[0] as any)?.tagName?.toLowerCase?.();
    if (contextSelectors.includes(tagName)) {
      const text = $parent.text().trim();
      if (text.length > 5) {
        parts.push(text);
        break; // closest semantic parent is most relevant
      }
    }
    $parent = $parent.parent();
  }

  // If no semantic parent found, try grandparent div or section
  if (parts.length === 0) {
    const $grandparent = $img.parent().parent();
    if ($grandparent.length > 0) {
      const text = $grandparent.text().trim();
      if (text.length > 10) {
        parts.push(text);
      }
    }
  }

  const combined = parts.join(' ').replace(/\s+/g, ' ').trim();
  const words = combined.split(' ');
  return words.slice(0, maxWords).join(' ');
}

function extractMedia(html: string, baseUrl: string, baseDomain: string): CrawledMedia[] {
  const media: CrawledMedia[] = [];
  const seenUrls = new Set<string>();
  
  try {
    const $ = load(html);
    
    // Extract images
    $('img').each((_, element) => {
      const $img = $(element);
      const src = $img.attr('src');
      
      if (!src) return;
      
      try {
        const absoluteUrl = new URL(src, baseUrl).toString();
        
        // Skip if already seen or external
        if (seenUrls.has(absoluteUrl) || !isSameDomain(absoluteUrl, baseDomain)) {
          return;
        }
        
        // Skip common decorative images (logos, icons, spacers)
        const alt = $img.attr('alt') || '';
        const src_lower = src.toLowerCase();
        
        if (
          src_lower.includes('logo') ||
          src_lower.includes('icon') ||
          src_lower.includes('spinner') ||
          src_lower.includes('loading') ||
          src_lower.includes('placeholder') ||
          src_lower.includes('dot.gif') ||
          src_lower.includes('pixel') ||
          src_lower.includes('banner') ||
          (alt.length < 3 && !$img.attr('title'))
        ) {
          return;
        }
        
        const width = $img.attr('width');
        const height = $img.attr('height');
        
        // Skip very small images (likely decorative)
        const w = width ? parseInt(width, 10) : null;
        const h = height ? parseInt(height, 10) : null;
        if ((w && w < 50) || (h && h < 50)) {
          return;
        }
        
        seenUrls.add(absoluteUrl);
        
        const surroundingText = getSurroundingText($img, $);
        
        const mediaItem: CrawledMedia = {
          type: 'image',
          mediaUrl: absoluteUrl,
          altText: alt || undefined,
          caption: $img.attr('title') || undefined,
          title: $img.attr('title') || undefined,
          mimeType: getMimeType(absoluteUrl),
          width: w || undefined,
          height: h || undefined,
          metadata: surroundingText ? { surroundingText } : undefined,
        };
        
        media.push(mediaItem);
      } catch (error) {
        // Invalid URL, skip
      }
    });
    
    // Extract images from picture elements (responsive images)
    $('picture img').each((_, element) => {
      const $img = $(element);
      const src = $img.attr('src');
      
      if (!src || seenUrls.has(src)) return;
      
      try {
        const absoluteUrl = new URL(src, baseUrl).toString();
        
        if (seenUrls.has(absoluteUrl) || !isSameDomain(absoluteUrl, baseDomain)) {
          return;
        }
        
        seenUrls.add(absoluteUrl);
        
        const mediaItem: CrawledMedia = {
          type: 'image',
          mediaUrl: absoluteUrl,
          altText: $img.attr('alt') || undefined,
          caption: $img.attr('title') || undefined,
          title: $img.attr('title') || undefined,
          mimeType: getMimeType(absoluteUrl),
        };
        
        media.push(mediaItem);
      } catch (error) {
        // Invalid URL, skip
      }
    });
    
    // Extract PDFs from links
    $('a[href*=".pdf"], a[data-pdf]').each((_, element) => {
      const $a = $(element);
      const href = $a.attr('href') || $a.attr('data-pdf');
      
      if (!href) return;
      
      try {
        const absoluteUrl = new URL(href, baseUrl).toString();
        
        if (seenUrls.has(absoluteUrl) || !isSameDomain(absoluteUrl, baseDomain)) {
          return;
        }
        
        seenUrls.add(absoluteUrl);
        
        const mediaItem: CrawledMedia = {
          type: 'pdf',
          mediaUrl: absoluteUrl,
          title: $a.text().trim() || undefined,
          altText: $a.attr('title') || $a.attr('aria-label') || undefined,
          mimeType: 'application/pdf',
        };
        
        media.push(mediaItem);
      } catch (error) {
        // Invalid URL, skip
      }
    });
    
    // Extract videos (iframe embeds)
    $('iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="video"]').each((_, element) => {
      const $iframe = $(element);
      const src = $iframe.attr('src');
      
      if (!src) return;
      
      try {
        const mediaItem: CrawledMedia = {
          type: 'video',
          mediaUrl: src,
          title: $iframe.attr('title') || undefined,
          altText: $iframe.attr('title') || undefined,
          mimeType: 'video/html5',
          width: $iframe.attr('width') ? parseInt($iframe.attr('width')!, 10) : undefined,
          height: $iframe.attr('height') ? parseInt($iframe.attr('height')!, 10) : undefined,
        };
        
        media.push(mediaItem);
      } catch (error) {
        // Invalid URL, skip
      }
    });
    
    // Extract images from figure/figcaption patterns
    $('figure img').each((_, element) => {
      const $img = $(element);
      const src = $img.attr('src');
      
      if (!src || seenUrls.has(src)) return;
      
      try {
        const absoluteUrl = new URL(src, baseUrl).toString();
        
        if (seenUrls.has(absoluteUrl) || !isSameDomain(absoluteUrl, baseDomain)) {
          return;
        }
        
        seenUrls.add(absoluteUrl);
        
        const $figure = $img.closest('figure');
        const $figcaption = $figure.find('figcaption');
        const figcaptionText = $figcaption.text().trim();
        
        // For figures, surrounding text is from outside the figure element
        const surroundingText = getSurroundingText($figure, $);
        const meta: Record<string, any> = {};
        if (surroundingText) meta.surroundingText = surroundingText;
        
        const mediaItem: CrawledMedia = {
          type: 'image',
          mediaUrl: absoluteUrl,
          altText: $img.attr('alt') || undefined,
          caption: figcaptionText || $img.attr('title') || undefined,
          title: $img.attr('title') || figcaptionText || undefined,
          mimeType: getMimeType(absoluteUrl),
          metadata: Object.keys(meta).length > 0 ? meta : undefined,
        };
        
        media.push(mediaItem);
      } catch (error) {
        // Invalid URL, skip
      }
    });
    
  } catch (error) {
    console.error('Error extracting media:', error);
  }
  
  return media;
}

/**
 * Gets MIME type from file extension
 */
function getMimeType(url: string): string {
  const ext = url.toLowerCase().split('.').pop() || '';
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
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
    const rawHtmlLength = htmlContent.length;
    
    const $ = load(htmlContent);
    
    // Extract page title
    const pageTitle = $('title').text().trim() || null;
    
    // Step 1: Remove all boilerplate elements before text extraction
    removeBoilerplate($);
    
    // Step 2: Extract primary content from semantic containers
    const textContent = extractMainContent($);
    
    // Debug logging for pipeline analysis
    const textPreview = textContent.substring(0, 500);
    console.log(`[CRAWL PAGE] URL: ${url}`);
    console.log(`[CRAWL PAGE] Raw HTML length: ${rawHtmlLength}`);
    console.log(`[CRAWL PAGE] Extracted text length: ${textContent.length}`);
    console.log(`[CRAWL PAGE] First 500 chars: ${textPreview.replace(/\n/g, '\\n')}`);
    
    // Extract media from the page
    const baseDomainFromUrl = getBaseDomain(url);
    const media = extractMedia(htmlContent, url, baseDomainFromUrl);
    
    return {
      url,
      pageTitle,
      textContent,
      htmlContent,
      contentLength: textContent.length,
      media,
    };
    
  } catch (error) {
    console.error(`Error crawling ${url}:`, error);
    return null;
  }
}

/**
 * Remove boilerplate/non-content elements from a cheerio DOM
 */
function removeBoilerplate($: any): void {
  // Remove scripts, styles, and other non-content tags
  $('script, style, noscript, iframe, svg, canvas, object, embed').remove();

  // Remove navigation and layout elements
  $('nav, header, footer, aside, form, button').remove();

  // Remove hidden elements
  $('[hidden], [style*="display:none"], [style*="display: none"], [style*="visibility:hidden"], [style*="visibility: hidden"]').remove();

  // Remove elements by common boilerplate class/id patterns
  const boilerplateSelectors = [
    '[class*="nav"]', '[class*="menu"]', '[class*="sidebar"]', '[class*="breadcrumb"]',
    '[class*="footer"]', '[class*="header"]', '[class*="cookie"]', '[class*="banner"]',
    '[class*="announce"]', '[class*="notification"]', '[class*="toast"]',
    '[class*="modal"]', '[class*="overlay"]', '[class*="popup"]', '[class*="pop-up"]',
    '[class*="widget"]', '[class*="chat"]', '[class*="floating"]',
    '[class*="social"]', '[class*="share"]', '[class*="comment"]',
    '[class*="register"]', '[class*="login"]', '[class*="search"]',
    '[class*="sidebar"]', '[class*="breadcrumb"]',
    '[id*="nav"]', '[id*="menu"]', '[id*="sidebar"]', '[id*="breadcrumb"]',
    '[id*="footer"]', '[id*="header"]', '[id*="cookie"]', '[id*="banner"]',
    '[id*="announce"]', '[id*="notification"]', '[id*="modal"]',
    '[id*="popup"]', '[id*="chat"]', '[id*="widget"]',
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]', '[role="complementary"]',
    '[aria-label*="nav"]', '[aria-label*="menu"]', '[aria-label*="breadcrumb"]',
    '.nav', '.navbar', '.nav-bar', '.top-nav', '.main-nav', '.primary-nav',
    '.secondary-nav', '.sub-nav', '.side-nav',
    '.menu', '.submenu', '.dropdown', '.dropdown-menu',
    '.breadcrumb', '.breadcrumbs', '.bread-crumb',
    '.sidebar', '.side-bar', '.left-sidebar', '.right-sidebar',
    '.footer', '.site-footer', '.footer-widget',
    '.header', '.site-header', '.top-header', '.top-bar',
    '.announcement', '.announcement-bar', '.alert-bar',
    '.cookie', '.cookie-banner', '.cookie-notice', '.cookie-consent',
    '.chat', '.chat-widget', '.chatbot', '.floating-chat', '.live-chat',
    '.whatsapp', '.whatsapp-button', '.whatsapp-float',
    '.newsletter', '.subscribe', '.email-signup',
    '.social-share', '.social-media', '.social-links',
    '.search-bar', '.search-box', '.search-form',
    '.back-to-top', '.scroll-top',
    '.page-loader', '.preloader', '.loading',
  ];

  boilerplateSelectors.forEach(selector => {
    try {
      $(selector).remove();
    } catch {
      // Skip invalid selectors
    }
  });
}

/**
 * Extract the primary content from a cheerio DOM
 * Tries semantic containers first, falls back to body
 */
function extractMainContent($: any): string {
  // Define content container selectors in priority order
  const contentSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.main-content',
    '.content-area',
    '.page-content',
    '.post-content',
    '.entry-content',
    '.article-content',
    '.content-wrapper',
    '.site-content',
    '#main-content',
    '#content',
    '.main',
  ];

  for (const selector of contentSelectors) {
    const $el = $(selector);
    if ($el.length > 0) {
      // Get the largest content element (most text)
      let best = $el.first();
      let bestLen = best.text().length;
      $el.each((_i: number, el: any) => {
        const len = $(el).text().length;
        if (len > bestLen) {
          best = $(el);
          bestLen = len;
        }
      });
      // Only use if it has substantial content
      if (bestLen > 200) {
        return best.text().replace(/\s+/g, ' ').trim();
      }
    }
  }

  // Fallback: use body with boilerplate already removed
  return $('body').text().replace(/\s+/g, ' ').trim();
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
  const maxPages = options.maxPages || 10000; // Increased from 100 to 10000
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
