public class MajorityVote {
    // Boyer–Moore: one pass, O(1) space. The candidate must be verified with a second pass.
    static Integer majority(int[] votes) {
        int candidate = 0, count = 0;
        for (int v : votes) {
            if (count == 0) candidate = v;
            count += (v == candidate) ? 1 : -1;
        }
        int occurrences = 0;
        for (int v : votes) if (v == candidate) occurrences++;
        return occurrences > votes.length / 2 ? candidate : null;
    }

    public static void main(String[] args) {
        System.out.println("[2, 2, 1, 1, 1, 2, 2] -> " + majority(new int[] {2, 2, 1, 1, 1, 2, 2}));
        System.out.println("[3, 3, 4] -> " + majority(new int[] {3, 3, 4}));
        System.out.println("[1, 2, 3] -> " + majority(new int[] {1, 2, 3}) + " (no majority; the candidate failed verification)");
        System.out.println("[1, 1, 2, 2] -> " + majority(new int[] {1, 1, 2, 2}) + " (exactly half is not a majority)");
    }
}
