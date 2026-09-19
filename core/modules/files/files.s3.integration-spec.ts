import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const shouldRun = process.env.RUN_S3_INTEGRATION === 'true';

(shouldRun ? describe : describe.skip)('AWS S3 file integration', () => {
  const bucket = process.env.AWS_BUCKET_NAME ?? '';
  const region = process.env.AWS_BUCKET_REGION ?? '';
  const client = new S3Client({ region });
  const key = `test-integration/${Date.now()}-lineup.txt`;

  afterAll(async () => {
    if (bucket && region) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    }
  });

  it('writes and reads an object in the configured test bucket', async () => {
    expect(bucket).toBeTruthy();
    expect(region).toBeTruthy();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from('lineup-s3-integration'),
        ContentType: 'text/plain',
        Metadata: { test: 'lineup' },
      }),
    );

    const metadata = await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );

    expect(metadata.ContentType).toBe('text/plain');
    expect(metadata.ContentLength).toBeGreaterThan(0);
    expect(metadata.Metadata?.test).toBe('lineup');
  });
});
