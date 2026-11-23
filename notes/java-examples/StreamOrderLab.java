import java.util.*;
import java.util.stream.*;

// Day 6 main lab: a typed stream pipeline, encounter-order guarantees, findFirst vs findAny, and laziness.
public class StreamOrderLab {
    record Booking(String id, String seat, int amount, boolean confirmed) {}

    // Generic helper with a bounded wildcard: accepts List<Integer>, List<Long>, ... and returns their sum as long.
    static long total(List<? extends Number> values) {
        long sum = 0;
        for (Number n : values) sum += n.longValue();
        return sum;
    }

    // PECS: the consumer side is "? super T", so a List<Object> can receive Bookings.
    static <T> void copyConfirmed(List<? extends T> from, List<? super T> to, java.util.function.Predicate<? super T> keep) {
        for (T t : from) if (keep.test(t)) to.add(t);
    }

    public static void main(String[] args) {
        List<Booking> bookings = List.of(
            new Booking("B1", "A1", 300, false), new Booking("B2", "A2", 450, true),
            new Booking("B3", "A3", 120, true),  new Booking("B4", "A4", 450, true),
            new Booking("B5", "A5", 900, false), new Booking("B6", "A6", 700, true));

        // Typed pipeline: Stream<Booking> -> Stream<Booking> -> Stream<String>. A List source is ORDERED.
        List<String> confirmedIds = bookings.stream().filter(Booking::confirmed).map(Booking::id).toList();
        System.out.println("confirmed ids (list order kept): " + confirmedIds);

        // Laziness + short-circuit: findFirst stops after the first match, so only 2 elements are examined.
        int[] examined = {0};
        Optional<Booking> first = bookings.stream().peek(b -> examined[0]++).filter(Booking::confirmed).findFirst();
        System.out.println("findFirst -> " + first.map(Booking::id).orElse("none") + ", elements examined: " + examined[0]);

        // findFirst on an ordered PARALLEL stream still returns the first match in encounter order.
        boolean stable = true;
        for (int i = 0; i < 200; i++) stable &= bookings.parallelStream().filter(b -> b.amount() >= 450).findFirst().orElseThrow().id().equals("B2");
        System.out.println("parallel findFirst always B2 over 200 runs: " + stable);

        // findAny gives no order guarantee: any matching element is a correct answer.
        Set<String> matches = Set.of("B2", "B4", "B5", "B6");
        boolean anyValid = true;
        for (int i = 0; i < 200; i++) anyValid &= matches.contains(bookings.parallelStream().filter(b -> b.amount() >= 450).findAny().orElseThrow().id());
        System.out.println("parallel findAny always one of " + new TreeSet<>(matches) + ": " + anyValid);

        // toList keeps encounter order even in parallel; a HashSet source has no encounter order to keep.
        List<Integer> parallelSquares = IntStream.rangeClosed(1, 8).parallel().map(x -> x * x).boxed().toList();
        System.out.println("parallel toList keeps order: " + parallelSquares);
        List<String> unorderedSource = new HashSet<>(List.of("B6", "B1", "B4")).stream().sorted().toList();
        System.out.println("HashSet source needs sorted() for a defined order: " + unorderedSource);

        // Collectors with a typed result.
        Map<Boolean, Long> countByStatus = bookings.stream().collect(Collectors.partitioningBy(Booking::confirmed, Collectors.counting()));
        System.out.println("count by confirmed: " + countByStatus);
        System.out.println("total of List<Integer>: " + total(bookings.stream().map(Booking::amount).toList()));
        List<Object> sink = new ArrayList<>();
        copyConfirmed(bookings, sink, Booking::confirmed);
        System.out.println("copied into List<Object>: " + sink.size());
    }
}
