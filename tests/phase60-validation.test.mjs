// Run from the CampusMart project root: node --test tests/phase60-validation.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { safeNext, cleanSearchWords, isUuid, validateSignup, validateListing, normalizePhone } from '../src/lib/validation.js';

test('redirect destinations stay on this site', () => {
  assert.equal(safeNext('/saved'), '/saved');
  assert.equal(safeNext('/listing/abc?tab=details'), '/listing/abc?tab=details');
  for (const value of ['https://example.org', '//example.org', '/\\example.org', 'javascript:alert(1)', null]) {
    assert.equal(safeNext(value, '/'), '/');
  }
});

test('search sanitizes filter operators and caps word count', () => {
  assert.deepEqual(cleanSearchWords('laptop% OR(price.eq.1) desk'), ['laptop', 'OR', 'price', 'eq', '1']);
  assert.equal(cleanSearchWords('  ').length, 0);
  assert.ok(cleanSearchWords('a b c d e f g').length <= 5);
});

test('UUID validator rejects unexpected identifiers', () => {
  assert.equal(isUuid('6a12008f-8a6e-41e0-9f8d-06e09cb101a2'), true);
  assert.equal(isUuid('abc/../../private'), false);
});

test('signup requires a name, email, password and consent', () => {
  const valid = { displayName: 'Campus Student', email: 'student@example.com', password: 'password123', terms: true };
  assert.deepEqual(validateSignup(valid), {});
  const invalid = validateSignup({ ...valid, terms: false, password: '123' });
  assert.ok(invalid.terms);
  assert.ok(invalid.password);
});

test('listing rejects invalid price, title and category', () => {
  const result = validateListing({ title: 'X', description: 'short', priceText: '-50', condition: 'unknown', categoryId: 'not-a-uuid', meetupSpotId: '' });
  for (const field of ['title', 'description', 'price', 'condition', 'category']) assert.ok(result[field]);
});

test('Ugandan phone normalization', () => {
  assert.equal(normalizePhone('0741 448 912').value, '+256741448912');
  assert.ok(normalizePhone('123').error);
});
