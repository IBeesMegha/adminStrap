/**
 * Test Cases for Web Content Extraction
 * 
 * Various HTML patterns to validate the extraction system
 */

import { extractWebContent } from '../lib/knowledge-processing';

// Test Case 1: E-commerce Product Page
const ecommerceHtml = `
<html>
<head><title>Wireless Bluetooth Headphones - Premium Audio</title></head>
<body>
  <nav class="navbar">
    <a href="/">Home</a> | <a href="/products">Products</a> | <a href="/cart">Cart</a>
  </nav>
  
  <div class="breadcrumb">Home > Electronics > Audio > Headphones</div>
  
  <main>
    <h1>Wireless Bluetooth Headphones</h1>
    
    <div class="product-gallery">
      <img src="/headphones-main.jpg" alt="Wireless headphones front view" width="600" height="600">
      <img src="/headphones-side.jpg" alt="Side view showing padding" width="400" height="400">
      <img src="/icon-fav.png" width="16" height="16" alt="favorite">
    </div>
    
    <div class="price">$199.99</div>
    <button class="add-to-cart">Add to Cart</button>
    <button class="buy-now">Buy Now</button>
    
    <h2>Product Description</h2>
    <p>Experience premium sound quality with our Wireless Bluetooth Headphones. 
    Engineered for audiophiles, these headphones deliver crystal-clear audio with 
    deep bass and crisp highs. Perfect for music, podcasts, and calls.</p>
    
    <h2>Key Features</h2>
    <ul>
      <li>Active Noise Cancellation (ANC) technology</li>
      <li>40-hour battery life on a single charge</li>
      <li>Premium memory foam ear cushions</li>
      <li>Bluetooth 5.2 with multipoint connectivity</li>
      <li>Built-in microphone for hands-free calls</li>
    </ul>
    
    <h2>Technical Specifications</h2>
    <table>
      <tr><td>Driver Size</td><td>40mm</td></tr>
      <tr><td>Frequency Response</td><td>20Hz - 20kHz</td></tr>
      <tr><td>Impedance</td><td>32 Ohms</td></tr>
      <tr><td>Bluetooth Version</td><td>5.2</td></tr>
      <tr><td>Battery Life</td><td>40 hours</td></tr>
      <tr><td>Charging Time</td><td>2 hours</td></tr>
      <tr><td>Weight</td><td>250g</td></tr>
    </table>
    
    <h2>What's in the Box</h2>
    <ul>
      <li>1x Wireless Headphones</li>
      <li>1x USB-C Charging Cable</li>
      <li>1x 3.5mm Audio Cable</li>
      <li>1x Carrying Case</li>
      <li>1x User Manual</li>
    </ul>
  </main>
  
  <aside class="related-products">
    <h3>You May Also Like</h3>
    <div>Wired Headphones</div>
    <div>Earbuds</div>
  </aside>
  
  <footer>
    <p>© 2024 AudioShop. Terms & Conditions | Privacy Policy</p>
    <div class="social">Facebook | Twitter | Instagram</div>
  </footer>
</body>
</html>
`;

// Test Case 2: Blog Article
const blogHtml = `
<html>
<head><title>10 Tips for Better Sleep - Health Blog</title></head>
<body>
  <header class="site-header">
    <nav>Home | Blog | About | Contact</nav>
  </header>
  
  <article>
    <h1>10 Tips for Better Sleep</h1>
    <p class="meta">By Dr. Sarah Johnson | March 15, 2024</p>
    
    <img src="/sleep-hero.jpg" alt="Person sleeping peacefully in bed" width="1200" height="600">
    
    <p>Quality sleep is essential for physical health, mental wellbeing, and daily performance. 
    Here are ten evidence-based tips to help you achieve better sleep naturally.</p>
    
    <h2>1. Maintain a Consistent Sleep Schedule</h2>
    <p>Going to bed and waking up at the same time every day helps regulate your body's 
    internal clock. This consistency makes it easier to fall asleep and wake up naturally.</p>
    
    <h2>2. Create a Relaxing Bedtime Routine</h2>
    <p>Develop a calming pre-sleep routine such as reading, gentle stretching, or meditation. 
    This signals to your body that it's time to wind down.</p>
    
    <img src="/bedtime-routine.jpg" alt="Relaxing bedtime activities" width="800" height="500">
    
    <h2>3. Optimize Your Sleep Environment</h2>
    <p>Keep your bedroom cool (around 65-68°F), dark, and quiet. Consider using blackout 
    curtains, earplugs, or a white noise machine if needed.</p>
    
    <h2>Key Takeaways</h2>
    <ul>
      <li>Consistency is more important than duration</li>
      <li>Your bedroom environment significantly impacts sleep quality</li>
      <li>Avoid screens and caffeine before bedtime</li>
    </ul>
    
    <button class="subscribe-btn">Subscribe to Our Newsletter</button>
  </article>
  
  <aside class="sidebar">
    <h3>Popular Posts</h3>
    <ul>
      <li><a href="#">Meditation for Beginners</a></li>
      <li><a href="#">Healthy Breakfast Ideas</a></li>
    </ul>
  </aside>
  
  <footer>Privacy Policy | Terms of Use | Cookie Settings</footer>
</body>
</html>
`;

// Test Case 3: Documentation Page
const docsHtml = `
<html>
<head><title>API Authentication Guide | Developer Docs</title></head>
<body>
  <nav class="docs-nav">
    <a href="/docs">Docs Home</a>
    <a href="/docs/quickstart">Quickstart</a>
    <a href="/docs/api">API Reference</a>
  </nav>
  
  <main class="docs-content">
    <h1>API Authentication Guide</h1>
    
    <p>This guide explains how to authenticate your API requests using API keys and OAuth tokens.</p>
    
    <h2>API Key Authentication</h2>
    <p>API keys are the simplest way to authenticate. Include your API key in the Authorization header:</p>
    
    <pre><code>Authorization: Bearer YOUR_API_KEY</code></pre>
    
    <h3>Obtaining an API Key</h3>
    <ol>
      <li>Log in to your dashboard</li>
      <li>Navigate to Settings > API Keys</li>
      <li>Click "Generate New Key"</li>
      <li>Copy and securely store your key</li>
    </ol>
    
    <h2>Security Best Practices</h2>
    <table>
      <tr><th>Practice</th><th>Description</th></tr>
      <tr>
        <td>Store Securely</td>
        <td>Never commit API keys to version control. Use environment variables.</td>
      </tr>
      <tr>
        <td>Rotate Regularly</td>
        <td>Generate new keys every 90 days for enhanced security.</td>
      </tr>
      <tr>
        <td>Use HTTPS</td>
        <td>Always make API requests over HTTPS to encrypt data in transit.</td>
      </tr>
    </table>
    
    <h2>Rate Limits</h2>
    <p>API requests are subject to the following rate limits:</p>
    <ul>
      <li>Free tier: 100 requests per hour</li>
      <li>Pro tier: 1,000 requests per hour</li>
      <li>Enterprise: Custom limits available</li>
    </ul>
    
    <div class="docs-cta">
      <button>Try the API Playground</button>
      <button>Read Full Documentation</button>
    </div>
  </main>
  
  <footer class="docs-footer">
    <p>© 2024 TechCorp | <a href="/terms">Terms</a> | <a href="/privacy">Privacy</a></p>
  </footer>
</body>
</html>
`;

// Run tests
function runTest(name: string, html: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${name}`);
  console.log('='.repeat(60));
  
  try {
    const result = extractWebContent(html);
    
    console.log('\n📄 TITLE:');
    console.log(result.title);
    
    console.log('\n📝 SECTIONS:');
    result.sections.forEach((section, i) => {
      console.log(`\n${i + 1}. ${section.heading}`);
      console.log(`   ${section.text.substring(0, 150)}${section.text.length > 150 ? '...' : ''}`);
    });
    
    console.log('\n📊 SPECIFICATIONS:');
    const specCount = Object.keys(result.specifications).length;
    if (specCount > 0) {
      Object.entries(result.specifications).slice(0, 5).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
      if (specCount > 5) {
        console.log(`   ... and ${specCount - 5} more`);
      }
    } else {
      console.log('   None found');
    }
    
    console.log('\n🖼️  IMAGES:');
    if (result.images.length > 0) {
      result.images.forEach((img, i) => {
        console.log(`   ${i + 1}. ${img.url}`);
        console.log(`      Alt: ${img.alt}`);
      });
    } else {
      console.log('   None found');
    }
    
    console.log('\n✅ SUMMARY:');
    console.log(`   Content length: ${result.content.length} chars`);
    console.log(`   Sections: ${result.sections.length}`);
    console.log(`   Images: ${result.images.length}`);
    console.log(`   Specifications: ${specCount}`);
    
    // Output JSON for verification
    console.log('\n📦 JSON OUTPUT:');
    console.log(JSON.stringify(result, null, 2).substring(0, 500) + '...');
    
  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
  }
}

// Run all tests
console.log('\n🧪 RUNNING WEB CONTENT EXTRACTION TESTS\n');

runTest('E-Commerce Product Page', ecommerceHtml);
runTest('Blog Article', blogHtml);
runTest('Documentation Page', docsHtml);

console.log('\n\n' + '='.repeat(60));
console.log('✨ ALL TESTS COMPLETED');
console.log('='.repeat(60) + '\n');
