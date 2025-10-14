import { PumpFunAPIClient } from './src/examples/basic-usage';

const client = new PumpFunAPIClient();

async function testClips() {
  try {
    console.log('Testing getStreamClips with old implementation...');

    // Test with a known live coin
    const mintId = 'F7dhwK9h6ibRpDeJ6TDrNLBNWFBPRuNquYqwgFFfpump';

    console.log(`Testing clips for: ${mintId}`);

    // Test complete clips
    const completeClips = await client.getStreamClips(mintId, 'COMPLETE', 5);
    console.log(`Complete clips found: ${completeClips.length}`);

    // Test highlight clips
    const highlightClips = await client.getStreamClips(mintId, 'HIGHLIGHT', 5);
    console.log(`Highlight clips found: ${highlightClips.length}`);

    if (completeClips.length > 0) {
      console.log('Sample complete clip:', JSON.stringify(completeClips[0], null, 2));
    }

    if (highlightClips.length > 0) {
      console.log('Sample highlight clip:', JSON.stringify(highlightClips[0], null, 2));
    }

  } catch (error) {
    console.error('Error testing clips:', error.message);
    console.error('Full error:', error);
  }
}

testClips();