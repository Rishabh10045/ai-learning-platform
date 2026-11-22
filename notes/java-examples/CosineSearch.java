import java.util.*;

// Ranks help passages by cosine similarity using small fixture vectors.
// Filters (venue, current version) run BEFORE ranking, so an unauthorized
// or outdated near-match can never be returned.
public class CosineSearch {
    record Passage(String id, String venue, int version, boolean current, double[] vector) {}
    record Hit(String id, double score) {}

    static double cosine(double[] a, double[] b) {
        if (a.length != b.length) throw new IllegalArgumentException("dimension mismatch: " + a.length + " vs " + b.length);
        double dot = 0, na = 0, nb = 0;
        for (int i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
        if (na == 0 || nb == 0) return 0;
        return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }

    static List<Hit> search(List<Passage> index, double[] query, String venue, int k) {
        return index.stream()
            .filter(p -> p.venue().equals(venue) && p.current())
            .map(p -> new Hit(p.id(), cosine(query, p.vector())))
            .sorted(Comparator.comparingDouble(Hit::score).reversed().thenComparing(Hit::id))
            .limit(k)
            .toList();
    }

    static String fmt(List<Hit> hits) {
        StringBuilder sb = new StringBuilder();
        for (Hit h : hits) sb.append(h.id()).append(String.format("(%.3f) ", h.score()));
        return sb.toString().trim();
    }

    public static void main(String[] args) {
        // Fixture dimensions: [cancel/refund, seats/map, payment, time/expiry]
        List<Passage> index = List.of(
            new Passage("cancellations-v2", "hall-a", 2, true,  new double[]{0.9, 0.1, 0.3, 0.2}),
            new Passage("cancellations-v1", "hall-a", 1, false, new double[]{0.95, 0.1, 0.2, 0.1}),
            new Passage("seat-map",         "hall-a", 1, true,  new double[]{0.1, 0.9, 0.0, 0.1}),
            new Passage("hold-expiry",      "hall-a", 1, true,  new double[]{0.3, 0.2, 0.1, 0.9}),
            new Passage("refunds-hall-b",   "hall-b", 3, true,  new double[]{0.92, 0.06, 0.25, 0.15})
        );
        double[] cannotAttend = {0.92, 0.05, 0.25, 0.15};
        System.out.println("cos(identical) = " + String.format("%.3f", cosine(new double[]{1, 2}, new double[]{2, 4})));
        System.out.println("query 'I cannot attend', hall-a, k=2: " + fmt(search(index, cannotAttend, "hall-a", 2)));
        System.out.println("without the venue filter, rank 1 would be: " +
            index.stream().max(Comparator.comparingDouble(p -> cosine(cannotAttend, p.vector()))).get().id());

        // A poor nearest result: "how long is my hold?" is phrased with refund-like words.
        double[] howLongHold = {0.6, 0.1, 0.1, 0.5};
        System.out.println("query 'how long is my hold', k=1: " + fmt(search(index, howLongHold, "hall-a", 1))
            + " (expected hold-expiry -> label as a retrieval miss)");
        try {
            cosine(new double[]{1, 0, 0}, new double[]{1, 0, 0, 0});
        } catch (IllegalArgumentException e) {
            System.out.println("mixed embedding models -> " + e.getMessage());
        }
    }
}
