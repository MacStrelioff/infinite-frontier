import { NextRequest, NextResponse } from 'next/server';
import { getHighestBid, type ChainId, CHAIN_IDS } from '@/lib/opensea';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contractAddress = searchParams.get('contract');
    const tokenId = searchParams.get('tokenId');
    const chain = (searchParams.get('chain') as ChainId) || CHAIN_IDS.base;

    if (!contractAddress || !tokenId) {
      return NextResponse.json(
        { error: 'Missing contract address or token ID' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENSEA_API_KEY;
    const bid = await getHighestBid(contractAddress, tokenId, chain, apiKey);

    return NextResponse.json({ bid });
  } catch (error) {
    console.error('OpenSea bid fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bid', bid: null },
      { status: 200 } // Return 200 with null bid to avoid breaking the UI
    );
  }
}
