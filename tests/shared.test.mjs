import test from 'node:test';
import assert from 'node:assert/strict';
import {
  completedByList,
  withCompletedBy,
  withoutCompletedBy,
  mergeEntryCompletion,
  sharedDayState,
  isSharedDayComplete,
  sharedHabitStats,
} from '../src/shared.ts';

const myId = 'dev-me';
const peerId = 'dev-peer';

test('withCompletedBy adds the device once', () => {
  const entry = { habitId: 'h1', date: '2026-11-14', completed: false };
  const next = withCompletedBy(entry, myId);
  assert.equal(next.completed, true);
  assert.deepEqual(next.completedBy, [myId]);

  const again = withCompletedBy(next, myId);
  assert.deepEqual(again.completedBy, [myId]);
});

test('withoutCompletedBy removes only my device', () => {
  const entry = {
    habitId: 'h1',
    date: '2026-11-14',
    completed: true,
    completedBy: [myId, peerId],
  };
  const next = withoutCompletedBy(entry, myId);
  assert.equal(next.completed, true);
  assert.deepEqual(next.completedBy, [peerId]);

  const none = withoutCompletedBy({ ...entry, completedBy: [myId] }, myId);
  assert.equal(none.completed, false);
  assert.deepEqual(none.completedBy, []);
});

test('mergeEntryCompletion unions the device ids', () => {
  const local = {
    habitId: 'h1',
    date: '2026-11-14',
    completed: true,
    completedBy: [myId],
    updatedAt: 100,
    updatedBy: myId,
  };
  const remote = {
    habitId: 'h1',
    date: '2026-11-14',
    completed: true,
    completedBy: [peerId],
    updatedAt: 200,
    updatedBy: peerId,
  };
  const merged = mergeEntryCompletion(local, remote);
  assert.equal(merged.completed, true);
  assert.deepEqual(merged.completedBy.sort(), [myId, peerId].sort());
  assert.equal(merged.updatedAt, 200);
});

test('mergeEntryCompletion keeps the union when the remote is older', () => {
  const local = {
    habitId: 'h1',
    date: '2026-11-14',
    completed: true,
    completedBy: [myId],
    updatedAt: 200,
    updatedBy: myId,
  };
  const remote = {
    habitId: 'h1',
    date: '2026-11-14',
    completed: true,
    completedBy: [peerId],
    updatedAt: 100,
    updatedBy: peerId,
  };
  const merged = mergeEntryCompletion(local, remote);
  assert.equal(merged.updatedAt, 200);
  assert.deepEqual(merged.completedBy.sort(), [myId, peerId].sort());
});

test('sharedDayState reports who did the habit', () => {
  const none = { habitId: 'h1', date: '2026-11-14', completed: false };
  assert.equal(sharedDayState(none, myId, peerId), 'none');

  const mine = { habitId: 'h1', date: '2026-11-14', completed: true, completedBy: [myId] };
  assert.equal(sharedDayState(mine, myId, peerId), 'mine');

  const theirs = { habitId: 'h1', date: '2026-11-14', completed: true, completedBy: [peerId] };
  assert.equal(sharedDayState(theirs, myId, peerId), 'theirs');

  const both = { habitId: 'h1', date: '2026-11-14', completed: true, completedBy: [myId, peerId] };
  assert.equal(sharedDayState(both, myId, peerId), 'both');
});

test('isSharedDayComplete needs both devices when paired', () => {
  const mine = { habitId: 'h1', date: '2026-11-14', completed: true, completedBy: [myId] };
  assert.equal(isSharedDayComplete(mine, myId, peerId), false);

  const both = { habitId: 'h1', date: '2026-11-14', completed: true, completedBy: [myId, peerId] };
  assert.equal(isSharedDayComplete(both, myId, peerId), true);
});

test('isSharedDayComplete accepts my completion when not paired', () => {
  const mine = { habitId: 'h1', date: '2026-11-14', completed: true, completedBy: [myId] };
  assert.equal(isSharedDayComplete(mine, myId, null), true);
});

test('sharedHabitStats counts the shared streak and the waiting days', () => {
  const habit = { id: 'h1', title: 'Run', scheduleDays: [1, 2, 3, 4, 5, 6, 7], createdAt: '2026-01-01', shared: true };
  const dates = ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14'];
  const entries = [
    { habitId: 'h1', date: '2026-11-10', completed: true, completedBy: [myId, peerId] },
    { habitId: 'h1', date: '2026-11-11', completed: true, completedBy: [myId] },
    { habitId: 'h1', date: '2026-11-12', completed: true, completedBy: [myId, peerId] },
    { habitId: 'h1', date: '2026-11-13', completed: true, completedBy: [myId, peerId] },
    { habitId: 'h1', date: '2026-11-14', completed: false },
  ];

  const stats = sharedHabitStats(habit, entries, dates, myId, peerId);
  assert.equal(stats.sharedDays, 3);
  assert.equal(stats.waitingDays, 1);
  assert.equal(stats.bestStreak, 2);
  assert.equal(stats.currentStreak, 2);
});
