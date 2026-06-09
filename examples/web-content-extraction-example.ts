/**
 * Example: Web Content Extraction
 * 
 * Demonstrates how to use the extractWebContent function
 * to clean and structure webpage HTML into meaningful JSON
 */

import { extractWebContent } from '../lib/knowledge-processing';

// Example HTML webpage content
const exampleHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Premium Oak Wood Flooring - Natural Collection</title>
  <style>.nav { display: flex; }</style>
  <script>console.log('tracking');</script>
</head>
<body>
  <!-- Navigation (will be removed) -->
  <nav class="main-nav">
    <a href="/">Home</a>
    <a href="/products">Products</a>
    <a href="/contact">Contact</a>
  </nav>
  
  <!-- Breadcrumbs (will be removed) -->
  <div class="breadcrumb">Home > Products > Flooring > Oak</div>
  
  <!-- Main Content -->
  <main>
    <h1>Premium Oak Wood Flooring</h1>
    
    <div class="product-description">
      <p>Our Premium Oak Wood Flooring combines timeless elegance with modern durability. 
      Each plank is carefully selected and treated to ensure long-lasting beauty in your home.</p>
      
      <img src="/images/oak-flooring-main.jpg" alt="Premium oak wood flooring in living room" 
           title="Beautiful oak flooring installation" width="800" height="600">
      
      <img src="/icons/star.png" width="20" height="20" alt="star icon">
    </div>
    
    <h2>Features & Benefits</h2>
    <ul>
      <li>100% natural oak wood sourced from sustainable forests</li>
      <li>UV-resistant protective coating for fade resistance</li>
      <li>Easy installation with click-lock system</li>
      <li>Suitable for both residential and commercial use</li>
    </ul>
    
    <h2>Technical Specifications</h2>
    <table class="specs-table">
      <tr>
        <th>Property</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Material</td>
        <td>100% Natural Oak</td>
      </tr>
      <tr>
        <td>Thickness</td>
        <td>15mm</td>
      </tr>
      <tr>
        <td>Width</td>
        <td>190mm</td>
      </tr>
      <tr>
        <td>Length</td>
        <td>1200mm</td>
      </tr>
      <tr>
        <td>Finish</td>
        <td>UV Lacquered</td>
      </tr>
      <tr>
        <td>Installation Method</td>
        <td>Click-Lock System</td>
      </tr>
    </table>
    
    <h2>Frequently Asked Questions</h2>
    
    <h3>Is this flooring suitable for kitchens?</h3>
    <p>Yes, our oak flooring is treated with water-resistant coating, making it suitable 
    for kitchens. However, we recommend wiping up spills promptly to maintain longevity.</p>
    
    <h3>What warranty is included?</h3>
    <p>All our premium flooring comes with a 25-year residential warranty and 
    10-year commercial warranty covering manufacturing defects.</p>
    
    <img src="/images/oak-flooring-detail.jpg" alt="Close-up of oak wood grain" width="600" height="400">
    
    <!-- Forms and CTAs (will be removed) -->
    <div class="cta-section">
      <button class="btn-primary">Enquire Now</button>
      <button class="btn-secondary">Download Brochure</button>
    </div>
    
    <form class="contact-form">
      <input type="text" name="name" placeholder="Your Name">
      <input type="email" name="email" placeholder="Your Email">
      <button type="submit">Send Enquiry</button>
    </form>
  </main>
  
  <!-- Sidebar (will be removed) -->
  <aside class="sidebar">
    <h3>Related Products</h3>
    <ul>
      <li>Walnut Flooring</li>
      <li>Maple Flooring</li>
    </ul>
  </aside>
  
  <!-- Footer (will be removed) -->
  <footer>
    <p>&copy; 2024 FloorCo. Privacy Policy | Terms & Conditions | Cookie Policy</p>
    <div class="social-links">
      <a href="#">Facebook</a>
      <a href="#">Twitter</a>
    </div>
  </footer>
  
  <script>analytics.track('page_view');</script>
</body>
</html>
`;

// Extract and structure the content
const extractedContent = extractWebContent(exampleHtml);

// Output the structured JSON
console.log('=== EXTRACTED WEB CONTENT ===\n');
console.log(JSON.stringify(extractedContent, null, 2));

// Access specific parts
console.log('\n=== QUICK ACCESS ===');
console.log('Title:', extractedContent.title);
console.log('Number of sections:', extractedContent.sections.length);
console.log('Number of images:', extractedContent.images.length);
console.log('Specifications found:', Object.keys(extractedContent.specifications).length);

// Example: Iterate through sections
console.log('\n=== SECTIONS ===');
extractedContent.sections.forEach((section, index) => {
  console.log(`\n${index + 1}. ${section.heading}`);
  console.log(`   ${section.text.substring(0, 100)}...`);
});

// Example: Display specifications
console.log('\n=== SPECIFICATIONS ===');
Object.entries(extractedContent.specifications).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

// Example: Display images
console.log('\n=== IMAGES ===');
extractedContent.images.forEach((img, index) => {
  console.log(`\n${index + 1}. ${img.url}`);
  console.log(`   Alt: ${img.alt}`);
  if (img.caption) {
    console.log(`   Caption: ${img.caption}`);
  }
});
