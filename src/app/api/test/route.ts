import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API server is working correctly',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    return NextResponse.json({
      success: true,
      message: 'POST request received',
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch {
    return NextResponse.json({
      success: false,
      message: 'Invalid JSON in request body',
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }
}
