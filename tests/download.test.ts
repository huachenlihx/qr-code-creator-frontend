import { test } from 'vitest';
import assert from 'node:assert/strict';
import { filenameFromDisposition, validateZipResponse, downloadBlob } from '@/lib/download';

const zip = (type='application/zip') => new Blob([Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00])], {type});

test('filename: returns null when header is absent', () => {
  assert.equal(filenameFromDisposition(), null);
});
test('filename: reads quoted ASCII filename', () => {
  assert.equal(filenameFromDisposition('attachment; filename="my_qr.zip"'), 'my_qr.zip');
});
test('filename: reads unquoted filename', () => {
  assert.equal(filenameFromDisposition('attachment; filename=qr.zip'), 'qr.zip');
});
test('filename: prefers RFC 5987 UTF-8 filename', () => {
  assert.equal(filenameFromDisposition("attachment; filename=qr.zip; filename*=UTF-8''my%20QR%20%E4%B8%AD%E6%96%87.zip"), 'my QR 中文.zip');
});
test('ZIP validation: accepts a ZIP local file header', async () => {
  await assert.doesNotReject(validateZipResponse(zip(), 200, 'application/zip'));
});
test('ZIP validation: accepts a valid ZIP even if MIME type is generic', async () => {
  await assert.doesNotReject(validateZipResponse(zip('application/octet-stream'), 200, 'application/octet-stream'));
});
test('ZIP validation: accepts an empty ZIP archive signature', async () => {
  const blob = new Blob([Uint8Array.from([0x50, 0x4b, 0x05, 0x06])]);
  await assert.doesNotReject(validateZipResponse(blob, 200));
});
test('ZIP validation: rejects non-success HTTP status', async () => {
  await assert.rejects(validateZipResponse(zip(), 403), /HTTP 403/);
});
test('ZIP validation: rejects JSON error body even with 200 status', async () => {
  await assert.rejects(validateZipResponse(new Blob(['{"detail":"expired challenge"}'], {type:'application/json'}), 200, 'application/json'), /error response/);
});
test('ZIP validation: rejects HTML error pages', async () => {
  await assert.rejects(validateZipResponse(new Blob(['<html>error</html>']), 200, 'text/html'), /error response/);
});
test('ZIP validation: rejects false ZIP with correct MIME type', async () => {
  await assert.rejects(validateZipResponse(new Blob(['not a ZIP'], {type:'application/zip'}), 200, 'application/zip'), /not a valid ZIP/);
});
test('ZIP validation: rejects truncated response', async () => {
  await assert.rejects(validateZipResponse(new Blob([Uint8Array.from([0x50,0x4b])]), 200), /not a valid ZIP/);
});
test('ZIP validation: rejects an empty response', async () => {
  await assert.rejects(validateZipResponse(new Blob([]), 200), /not a valid ZIP/);
});
test('downloadBlob: creates a link, triggers download, and schedules cleanup', () => {
  const originalDocument = globalThis.document;
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const originalTimeout = globalThis.setTimeout;
  let clicked=false, removed=false, appended=false, revoked=false;
  let delay: number | undefined;
  const anchor = {href:'', download:'', click(){clicked=true}, remove(){removed=true}} as unknown as HTMLAnchorElement;
  const mockDocument = {
    createElement(tagName: string) {
      assert.equal(tagName,'a');
      return anchor;
    },
    body: {
      appendChild<T extends Node>(item: T): T {
        assert.equal(item, anchor);
        appended=true;
        return item;
      }
    }
  } as unknown as Document;
  globalThis.document=mockDocument;
  URL.createObjectURL=()=> 'blob:sample';
  URL.revokeObjectURL=(url)=>{assert.equal(url,'blob:sample');revoked=true};
  globalThis.setTimeout=((callback: (...args: unknown[]) => void, ms?: number): ReturnType<typeof setTimeout> => {
    delay=ms;
    callback();
    return 1 as unknown as ReturnType<typeof setTimeout>;
  }) as typeof setTimeout;
  try {
    downloadBlob(zip(),'download.zip');
    assert.equal(anchor.href,'blob:sample');
    assert.equal(anchor.download,'download.zip');
    assert.ok(clicked && removed && appended && revoked);
    assert.equal(delay,1000);
  } finally {
    globalThis.document=originalDocument;
    URL.createObjectURL=originalCreate;
    URL.revokeObjectURL=originalRevoke;
    globalThis.setTimeout=originalTimeout;
  }
});
