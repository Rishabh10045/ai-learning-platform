import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class WeightedIntervals {
    record Job(String id, int start, int end, int value) {}   // half-open [start, end)

    // best[i] = max value using only the first i jobs (sorted by end time).
    static List<String> solve(List<Job> input, int buffer, int[] totalOut) {
        List<Job> jobs = new ArrayList<>(input);
        jobs.sort(Comparator.comparingInt(Job::end).thenComparing(Job::id));
        int n = jobs.size();
        int[] pred = new int[n];          // number of jobs compatible before job i
        for (int i = 0; i < n; i++) pred[i] = lastCompatible(jobs, i, buffer);
        long[] best = new long[n + 1];
        for (int i = 1; i <= n; i++) {
            Job j = jobs.get(i - 1);
            long take = j.value() + best[pred[i - 1]];
            best[i] = Math.max(best[i - 1], take);            // skip vs take
        }
        List<String> chosen = new ArrayList<>();              // reconstruct by walking back
        for (int i = n; i > 0; ) {
            Job j = jobs.get(i - 1);
            if (j.value() + best[pred[i - 1]] > best[i - 1]) { chosen.add(j.id()); i = pred[i - 1]; }
            else i--;
        }
        Collections.reverse(chosen);
        totalOut[0] = (int) best[n];
        return chosen;
    }

    // Binary search: count of jobs (by end order) with end + buffer <= start of job i.
    static int lastCompatible(List<Job> jobs, int i, int buffer) {
        int lo = 0, hi = i;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if ((long) jobs.get(mid).end() + buffer <= jobs.get(i).start()) lo = mid + 1; else hi = mid;
        }
        return lo;
    }

    public static void main(String[] args) {
        int[] total = new int[1];
        List<Job> simple = List.of(new Job("short1", 0, 2, 1), new Job("short2", 2, 4, 1), new Job("long", 0, 4, 10));
        System.out.println("chosen " + solve(simple, 0, total) + " total " + total[0] + " (earliest finish would total 2)");

        List<Job> day = List.of(new Job("A", 0, 3, 5), new Job("B", 1, 5, 6), new Job("C", 3, 6, 5),
            new Job("D", 5, 8, 4), new Job("E", 6, 9, 3));
        System.out.println("no buffer: " + solve(day, 0, total) + " total " + total[0]);
        System.out.println("buffer 1 : " + solve(day, 1, total) + " total " + total[0]);
    }
}
