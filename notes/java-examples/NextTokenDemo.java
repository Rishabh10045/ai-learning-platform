import java.util.*;

// A tiny bigram "language model": training changes the weights (counts); inference only reads them.
// Softmax with temperature turns scores into next-token probabilities.
public class NextTokenDemo {
    static final Map<String, Map<String, Integer>> weights = new TreeMap<>();

    static void train(String text) {                       // training: weights change
        String[] t = text.toLowerCase(Locale.ROOT).split("\\s+");
        for (int i = 0; i + 1 < t.length; i++)
            weights.computeIfAbsent(t[i], k -> new TreeMap<>()).merge(t[i + 1], 1, Integer::sum);
    }

    static Map<String, Double> nextTokenProbs(String prev, double temperature) {   // inference: read-only
        Map<String, Integer> counts = weights.getOrDefault(prev, Map.of());
        Map<String, Double> p = new TreeMap<>();
        double sum = 0;
        for (var e : counts.entrySet()) { double s = Math.exp(Math.log(e.getValue()) / temperature); p.put(e.getKey(), s); sum += s; }
        for (var e : p.entrySet()) e.setValue(e.getValue() / sum);
        return p;
    }

    static String greedy(String start, int n) {
        StringBuilder sb = new StringBuilder(start);
        String cur = start;
        for (int i = 0; i < n; i++) {
            var p = nextTokenProbs(cur, 1.0);
            if (p.isEmpty()) break;
            cur = Collections.max(p.entrySet(), Map.Entry.comparingByValue()).getKey();
            sb.append(' ').append(cur);
        }
        return sb.toString();
    }

    static String fmt(Map<String, Double> p) {
        StringBuilder sb = new StringBuilder("{");
        p.forEach((k, v) -> sb.append(sb.length() > 1 ? ", " : "").append(k).append('=').append(String.format("%.2f", v)));
        return sb.append('}').toString();
    }

    public static void main(String[] args) {
        train("cancel up to 48 hours before the show . cancel up to 48 hours before the event . cancel your booking online .");
        String snapshot = weights.toString();
        System.out.println("after 'cancel' (T=1.0): " + fmt(nextTokenProbs("cancel", 1.0)));
        System.out.println("after 'cancel' (T=0.5): " + fmt(nextTokenProbs("cancel", 0.5)) + "  <- sharper");
        System.out.println("after 'cancel' (T=2.0): " + fmt(nextTokenProbs("cancel", 2.0)) + "  <- flatter");
        System.out.println("greedy: " + greedy("cancel", 6));
        System.out.println("weights unchanged by inference: " + snapshot.equals(weights.toString()));
        System.out.println("unknown context 'parking': " + nextTokenProbs("parking", 1.0) + " (no evidence -> must fall back)");
        System.out.println("the model has no idea the policy changed to 24 hours until it is retrained or given the new text in its context");
    }
}
