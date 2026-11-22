import java.util.Arrays;

public class QuorumReads {
    // N replicas each hold (version, value). A write reaches W replicas; a read asks R replicas
    // and keeps the highest version. If R + W > N, every read set overlaps every write set.
    static final int N = 3;
    static long[] version = new long[N];
    static String[] value = new String[N];

    static void write(String v, long ver, int[] reached) {
        for (int i : reached) { version[i] = ver; value[i] = v; }
    }

    static String read(int[] asked) {
        int best = asked[0];
        for (int i : asked) if (version[i] > version[best]) best = i;
        return value[best] + " (v" + version[best] + ")";
    }

    public static void main(String[] args) {
        Arrays.fill(value, "free");
        write("owned by U1", 1, new int[] {0, 1});          // W = 2; replica 2 lags
        System.out.println("R=1 from the lagging replica: " + read(new int[] {2}));
        System.out.println("R=2 from replicas 1 and 2:    " + read(new int[] {1, 2}));
        System.out.println("R=2 from replicas 0 and 2:    " + read(new int[] {0, 2}));
        int overlapsFound = 0, pairs = 0;
        int[][] writeSets = {{0, 1}, {0, 2}, {1, 2}};
        int[][] readSets = {{0, 1}, {0, 2}, {1, 2}};
        for (int[] w : writeSets) for (int[] r : readSets) {
            pairs++;
            boolean overlap = false;
            for (int a : w) for (int b : r) if (a == b) overlap = true;
            if (overlap) overlapsFound++;
        }
        System.out.println("W=2, R=2, N=3: " + overlapsFound + " of " + pairs + " read/write quorum pairs overlap");
        System.out.println("W=1, R=1, N=3: a read can miss the only replica that took the write");
    }
}
