import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    const version = packageJson.version;

    return NextResponse.json({ version });
  } catch (error) {
    console.error('Failed to read package.json:', error);
    return NextResponse.json({ error: 'Failed to retrieve version' }, { status: 500 });
  }
}
