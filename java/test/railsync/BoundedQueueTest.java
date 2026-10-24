package railsync;

import railsync.concurrency.BoundedFIFOQueue;

/**
 * Rigorous test suite for BoundedFIFOQueue.
 * Tests FIFO order, capacity limits, blocking producer/consumer,
 * multi-threaded contention, and graceful shutdown/drain.
 */
public class BoundedQueueTest {
    private static int testsRun = 0;
    private static int testsPassed = 0;

    private static void assertTrue(boolean condition, String name) {
        testsRun++;
        if (condition) {
            testsPassed++;
            System.out.println("  [PASS] " + name);
        } else {
            System.err.println("  [FAIL] " + name);
        }
    }

    public static void main(String[] args) throws Exception {
        System.out.println("====================================================");
        System.out.println("Running BoundedFIFOQueue Monitor Verification Tests");
        System.out.println("====================================================");

        testBasicFifoOrder();
        testCapacityBounds();
        testProducerBlockingWhenFull();
        testConsumerBlockingWhenEmpty();
        testMultiThreadedProducerConsumer();
        testGracefulShutdownAndDrain();
        testRepeatedProducerConsumerCycles();

        System.out.println("----------------------------------------------------");
        System.out.println(String.format("Queue Tests Completed: %d/%d passed.", testsPassed, testsRun));
        System.out.println("====================================================");

        if (testsPassed != testsRun) {
            System.exit(1);
        }
    }

    private static void testBasicFifoOrder() throws Exception {
        System.out.println();
        System.out.println("Test: Basic FIFO Ordering");
        BoundedFIFOQueue queue = new BoundedFIFOQueue(5);
        queue.put("Item-1");
        queue.put("Item-2");
        queue.put("Item-3");

        assertTrue(queue.size() == 3, "Queue size is 3");
        assertTrue("Item-1".equals(queue.take()), "First out is Item-1");
        assertTrue("Item-2".equals(queue.take()), "Second out is Item-2");
        assertTrue("Item-3".equals(queue.take()), "Third out is Item-3");
        assertTrue(queue.size() == 0, "Queue is empty after draining");
    }

    private static void testCapacityBounds() {
        System.out.println();
        System.out.println("Test: Capacity Bounds Validation");
        try {
            new BoundedFIFOQueue(0);
            assertTrue(false, "Should reject zero capacity");
        } catch (IllegalArgumentException e) {
            assertTrue(true, "Rejected zero capacity");
        }
        try {
            BoundedFIFOQueue q = new BoundedFIFOQueue(2);
            q.put(null);
            assertTrue(false, "Should reject null item");
        } catch (IllegalArgumentException e) {
            assertTrue(true, "Rejected null item");
        } catch (Exception e) {
            assertTrue(false, "Unexpected exception: " + e);
        }
    }

    private static void testProducerBlockingWhenFull() throws Exception {
        System.out.println();
        System.out.println("Test: Producer Blocks When Queue is Full");
        final BoundedFIFOQueue queue = new BoundedFIFOQueue(2);
        queue.put("A");
        queue.put("B");

        final boolean[] blocked = {false};
        final boolean[] finished = {false};

        Thread producer = new Thread(() -> {
            try {
                blocked[0] = true;
                queue.put("C"); // Must block!
                finished[0] = true;
            } catch (InterruptedException e) {
                // expected
            }
        });

        producer.start();
        Thread.sleep(100);

        assertTrue(blocked[0] && !finished[0], "Producer is blocked waiting for space");
        assertTrue(queue.size() == 2, "Queue size remains at capacity (2)");

        // Consumer takes 1 item, unblocking producer
        Object taken = queue.take();
        assertTrue("A".equals(taken), "Consumer took item A");

        producer.join(500);
        assertTrue(finished[0], "Producer unblocked and finished putting item C");
        assertTrue(queue.size() == 2, "Queue has 2 items now (B and C)");
    }

    private static void testConsumerBlockingWhenEmpty() throws Exception {
        System.out.println();
        System.out.println("Test: Consumer Blocks When Queue is Empty");
        final BoundedFIFOQueue queue = new BoundedFIFOQueue(3);
        final Object[] received = {null};
        final boolean[] blocked = {false};

        Thread consumer = new Thread(() -> {
            try {
                blocked[0] = true;
                received[0] = queue.take(); // Must block!
            } catch (InterruptedException e) {
                // expected
            }
        });

        consumer.start();
        Thread.sleep(100);

        assertTrue(blocked[0] && received[0] == null, "Consumer is blocked waiting for item");

        queue.put("Hello");
        consumer.join(500);

        assertTrue("Hello".equals(received[0]), "Consumer unblocked and received 'Hello'");
    }

    private static void testMultiThreadedProducerConsumer() throws Exception {
        System.out.println();
        System.out.println("Test: Multi-Threaded Contention (4 Producers, 4 Consumers, 1000 items)");
        final int itemCount = 1000;
        final int numProducers = 4;
        final int numConsumers = 4;
        final int itemsPerProducer = itemCount / numProducers;
        final BoundedFIFOQueue queue = new BoundedFIFOQueue(10);

        final int[] consumedCount = {0};
        final Object counterLock = new Object();

        Thread[] consumers = new Thread[numConsumers];
        for (int c = 0; c < numConsumers; c++) {
            consumers[c] = new Thread(() -> {
                try {
                    while (true) {
                        Object item = queue.take();
                        if (item == null) break;
                        synchronized (counterLock) {
                            consumedCount[0]++;
                        }
                    }
                } catch (InterruptedException e) {
                    // expected
                }
            });
            consumers[c].start();
        }

        Thread[] producers = new Thread[numProducers];
        for (int p = 0; p < numProducers; p++) {
            final int pId = p;
            producers[p] = new Thread(() -> {
                try {
                    for (int i = 0; i < itemsPerProducer; i++) {
                        queue.put("Msg-" + pId + "-" + i);
                    }
                } catch (InterruptedException e) {
                    // expected
                }
            });
            producers[p].start();
        }

        // Wait for all producers to finish
        for (Thread p : producers) {
            p.join();
        }

        // Shutdown queue and wait for consumers to drain
        queue.shutdown();
        for (Thread c : consumers) {
            c.join();
        }

        assertTrue(consumedCount[0] == itemCount, "All 1000 items produced and consumed without loss");
        assertTrue(queue.size() == 0, "Queue completely drained to 0");
    }

    private static void testGracefulShutdownAndDrain() throws Exception {
        System.out.println();
        System.out.println("Test: Graceful Shutdown (Rejects New, Drains Existing)");
        BoundedFIFOQueue queue = new BoundedFIFOQueue(5);
        queue.put("Item-1");
        queue.put("Item-2");

        queue.shutdown();
        assertTrue(queue.isShutdown(), "Queue isShutdown is true");

        // Attempt to put after shutdown must throw IllegalStateException
        boolean rejected = false;
        try {
            queue.put("Item-3");
        } catch (IllegalStateException e) {
            rejected = true;
        }
        assertTrue(rejected, "New put rejected with IllegalStateException after shutdown");

        // Existing items can be taken
        assertTrue("Item-1".equals(queue.take()), "Can take existing Item-1 after shutdown");
        assertTrue("Item-2".equals(queue.take()), "Can take existing Item-2 after shutdown");
        assertTrue(queue.take() == null, "take() on empty shutdown queue returns null");
    }

    private static void testRepeatedProducerConsumerCycles() throws Exception {
        System.out.println();
        System.out.println("Test: Repeated Producer-Consumer Cycles (5 cycles of 500 items, zero deadlocks/loss)");
        final int cycles = 5;
        final int itemsPerCycle = 500;
        boolean allCyclesPassed = true;

        for (int cycle = 1; cycle <= cycles; cycle++) {
            final BoundedFIFOQueue queue = new BoundedFIFOQueue(8);
            final int[] consumed = {0};
            final Object countLock = new Object();

            Thread consumer = new Thread(() -> {
                try {
                    while (true) {
                        Object item = queue.take();
                        if (item == null) break;
                        synchronized (countLock) {
                            consumed[0]++;
                        }
                    }
                } catch (InterruptedException e) {
                    // expected
                }
            });
            consumer.start();

            Thread producer = new Thread(() -> {
                try {
                    for (int i = 0; i < itemsPerCycle; i++) {
                        queue.put("Cycle-" + i);
                    }
                } catch (InterruptedException e) {
                    // expected
                }
            });
            producer.start();

            producer.join(2000);
            queue.shutdown();
            consumer.join(2000);

            if (consumed[0] != itemsPerCycle || queue.size() != 0) {
                allCyclesPassed = false;
                System.err.println("Cycle " + cycle + " failed! Consumed: " + consumed[0] + ", Queue size: " + queue.size());
            }
        }

        assertTrue(allCyclesPassed, "All 5 repeated producer-consumer cycles completed with zero deadlocks and zero lost items (2500 items total)");
    }
}
