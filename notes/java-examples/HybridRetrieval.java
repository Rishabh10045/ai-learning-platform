import java.util.*;

// Combines an exact policy-code path with a vector path using reciprocal rank fusion.
// The same venue and version filter guards both candidate paths.
public class HybridRetrieval {
    record Doc(String id, String code, String venue, boolean current, double[] vector) {}

    static double cosine(double[] a, double[] b) {
        double dot = 0, na = 0, nb = 0;
        for (int i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
        return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }

    static boolean allowed(Doc d, String venue) { return d.venue().equals(venue) && d.current(); }

    static List<String> exact(List<Doc> docs, String query, String venue) {
        String q = query.toUpperCase(Locale.ROOT);
        return docs.stream().filter(d -> allowed(d, venue) && q.contains(d.code())).map(Doc::id).toList();
    }

    static List<String> vector(List<Doc> docs, double[] q, String venue, int k) {
        return docs.stream().filter(d -> allowed(d, venue))
            .sorted(Comparator.comparingDouble((Doc d) -> cosine(q, d.vector())).reversed())
            .limit(k).map(Doc::id).toList();
    }

    // Weighted reciprocal rank fusion: score = sum of weight / (60 + rank) across lists.
    // The exact-code list gets weight 2, so a literal code match outranks a paraphrase hit.
    static List<String> fuse(List<String> exactIds, List<String> vectorIds, int k) {
        Map<String, Double> score = new HashMap<>();
        for (int r = 0; r < exactIds.size(); r++) score.merge(exactIds.get(r), 2.0 / (60 + r + 1), Double::sum);
        for (int r = 0; r < vectorIds.size(); r++) score.merge(vectorIds.get(r), 1.0 / (60 + r + 1), Double::sum);
        return score.entrySet().stream()
            .sorted(Map.Entry.<String, Double>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
            .limit(k).map(Map.Entry::getKey).toList();
    }

    public static void main(String[] args) {
        List<Doc> docs = List.of(
            new Doc("cancel-04",  "CANCEL-04", "hall-a", true,  new double[]{0.4, 0.6, 0.1}),
            new Doc("cancel-02",  "CANCEL-02", "hall-a", true,  new double[]{0.9, 0.1, 0.1}),
            new Doc("refund-faq", "REFUND-01", "hall-a", true,  new double[]{0.85, 0.2, 0.1}),
            new Doc("cancel-04b", "CANCEL-04", "hall-b", true,  new double[]{0.9, 0.2, 0.1}),
            new Doc("cancel-04o", "CANCEL-04", "hall-a", false, new double[]{0.9, 0.1, 0.1})
        );
        String query = "what does CANCEL-04 mean";
        double[] qv = {0.9, 0.15, 0.1};
        List<String> ex = exact(docs, query, "hall-a");
        List<String> vec = vector(docs, qv, "hall-a", 2);
        System.out.println("exact  : " + ex);
        System.out.println("vector : " + vec + "  (misses the code)");
        System.out.println("hybrid : " + fuse(ex, vec, 3));
        System.out.println("paraphrase 'I cannot attend' hybrid: " +
            fuse(exact(docs, "I cannot attend", "hall-a"), vector(docs, qv, "hall-a", 2), 2));
        System.out.println("hall-b and outdated CANCEL-04 excluded: " + !fuse(ex, vec, 5).contains("cancel-04b")
            + " " + !fuse(ex, vec, 5).contains("cancel-04o"));
    }
}
