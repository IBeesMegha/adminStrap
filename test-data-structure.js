/**
 * Test Script for Data Structure Fixes
 * 
 * Run this script to verify that:
 * 1. Single types return correct data
 * 2. Dynamic zones are stored as arrays (not stringified)
 * 3. Nested components maintain hierarchy
 * 4. Arrays remain arrays
 */

const BASE_URL = 'http://localhost:3000';

async function testSingleTypeAPI() {
  console.log('\n=== Testing Single Type API ===\n');
  
  try {
    // Test About page
    console.log('Fetching /api/single-types/about...');
    const aboutRes = await fetch(`${BASE_URL}/api/single-types/about`);
    const aboutData = await aboutRes.json();
    
    console.log('About page name:', aboutData.data?.name);
    console.log('About page data:', JSON.stringify(aboutData.data?.data, null, 2));
    
    if (aboutData.data?.name !== 'about') {
      console.error('❌ FAIL: About page returned wrong name:', aboutData.data?.name);
    } else {
      console.log('✅ PASS: About page returns correct data');
    }
    
    // Test Home page
    console.log('\nFetching /api/single-types/home...');
    const homeRes = await fetch(`${BASE_URL}/api/single-types/home`);
    const homeData = await homeRes.json();
    
    console.log('Home page name:', homeData.data?.name);
    console.log('Home page data:', JSON.stringify(homeData.data?.data, null, 2));
    
    if (homeData.data?.name !== 'home') {
      console.error('❌ FAIL: Home page returned wrong name:', homeData.data?.name);
    } else {
      console.log('✅ PASS: Home page returns correct data');
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

async function testDynamicZoneStructure() {
  console.log('\n=== Testing Dynamic Zone Structure ===\n');
  
  try {
    const res = await fetch(`${BASE_URL}/api/single-types/about`);
    const data = await res.json();
    
    const sections = data.data?.data?.sections;
    
    console.log('Sections type:', typeof sections);
    console.log('Is array:', Array.isArray(sections));
    console.log('Sections value:', JSON.stringify(sections, null, 2));
    
    if (typeof sections === 'string') {
      console.error('❌ FAIL: Sections is a string (should be array)');
      console.log('String value:', sections);
    } else if (Array.isArray(sections)) {
      console.log('✅ PASS: Sections is an array');
      
      // Check if any section has numeric keys (wrong structure)
      sections.forEach((section, index) => {
        if (section && typeof section === 'object') {
          const keys = Object.keys(section);
          const hasNumericKeys = keys.some(key => /^\d+$/.test(key));
          
          if (hasNumericKeys) {
            console.error(`❌ FAIL: Section ${index} has numeric keys (array converted to object):`, keys);
          } else {
            console.log(`✅ PASS: Section ${index} has correct structure`);
          }
        }
      });
    } else {
      console.error('❌ FAIL: Sections is neither string nor array:', typeof sections);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

async function testNestedComponentHierarchy() {
  console.log('\n=== Testing Nested Component Hierarchy ===\n');
  
  try {
    const res = await fetch(`${BASE_URL}/api/single-types/about`);
    const data = await res.json();
    
    const sections = data.data?.data?.sections;
    
    if (Array.isArray(sections)) {
      sections.forEach((section, index) => {
        console.log(`\nSection ${index}:`);
        console.log('  __component:', section.__component);
        console.log('  Has data property:', 'data' in section);
        console.log('  Data type:', typeof section.data);
        
        if (section.data && typeof section.data === 'object') {
          console.log('  Data keys:', Object.keys(section.data));
          
          // Check if root-level fields are mixed with component data
          const rootKeys = Object.keys(section).filter(k => k !== '__component' && k !== 'id' && k !== 'data');
          if (rootKeys.length > 0) {
            console.error(`  ❌ FAIL: Component has root-level data mixed in:`, rootKeys);
          } else {
            console.log('  ✅ PASS: Component data is properly nested');
          }
          
          // Check nested lists
          if (section.data.list && Array.isArray(section.data.list)) {
            console.log('  Nested list length:', section.data.list.length);
            console.log('  ✅ PASS: Nested list is an array');
          }
        }
      });
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

async function testMediaArrays() {
  console.log('\n=== Testing Media Arrays ===\n');
  
  try {
    const res = await fetch(`${BASE_URL}/api/single-types/about`);
    const data = await res.json();
    
    const banner = data.data?.data?.banner;
    
    console.log('Banner type:', typeof banner);
    console.log('Is array:', Array.isArray(banner));
    console.log('Banner value:', JSON.stringify(banner, null, 2));
    
    if (typeof banner === 'string') {
      console.error('❌ FAIL: Banner is a string (should be array)');
    } else if (Array.isArray(banner)) {
      console.log('✅ PASS: Banner is an array');
      
      // Check if it's an array with numeric keys (wrong)
      if (banner.length > 0 && typeof banner[0] === 'object' && '0' in banner[0]) {
        console.error('❌ FAIL: Banner array contains objects with numeric keys');
      }
    } else if (banner && typeof banner === 'object') {
      const keys = Object.keys(banner);
      const hasNumericKeys = keys.some(key => /^\d+$/.test(key));
      
      if (hasNumericKeys) {
        console.error('❌ FAIL: Banner is an object with numeric keys (should be array):', keys);
      }
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

async function runAllTests() {
  console.log('🧪 Starting Data Structure Tests...');
  console.log('Make sure your dev server is running on', BASE_URL);
  
  await testSingleTypeAPI();
  await testDynamicZoneStructure();
  await testNestedComponentHierarchy();
  await testMediaArrays();
  
  console.log('\n✅ All tests completed!\n');
}

// Run tests
runAllTests().catch(console.error);
