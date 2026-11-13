import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BROKER_BACKOFF,
  LINK_BACKOFF,
  backoffDelay,
  reconnectDelay,
} from '../src/sync/reconnect.ts';

test('a link that dropped comes back fast', () => {
  assert.equal(reconnectDelay(0, false), LINK_BACKOFF.baseMs);
  assert.equal(reconnectDelay(1, false), 3750);
  assert.equal(reconnectDelay(2, false), 5625);
});

test('the link retry never waits longer than the policy allows', () => {
  assert.equal(reconnectDelay(30, false), LINK_BACKOFF.maxMs);
});

test('a blocked broker is asked much later', () => {
  assert.equal(reconnectDelay(0, true), BROKER_BACKOFF.baseMs);
  assert.equal(reconnectDelay(1, true), 30000);
  assert.equal(reconnectDelay(2, true), 60000);
});

test('the blocked broker retry stays within its long wait', () => {
  assert.equal(reconnectDelay(20, true), BROKER_BACKOFF.maxMs);
});

test('a negative attempt does not make the delay negative', () => {
  assert.equal(backoffDelay(-5, LINK_BACKOFF), LINK_BACKOFF.baseMs);
});
