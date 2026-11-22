import java.util.Arrays;
import java.util.PriorityQueue;

public class MinRooms {
    // Minimum rooms so that no two overlapping bookings share a room. Half-open [start, end).
    static int minRooms(int[][] bookings) {
        int[][] b = bookings.clone();
        Arrays.sort(b, (x, y) -> Integer.compare(x[0], y[0]));
        PriorityQueue<Integer> endTimes = new PriorityQueue<>();   // end time of each room in use
        for (int[] bk : b) {
            if (!endTimes.isEmpty() && endTimes.peek() <= bk[0]) endTimes.poll();   // reuse the room that frees first
            endTimes.offer(bk[1]);
        }
        return endTimes.size();
    }

    // Same answer with two sorted arrays: count starts minus ends seen so far.
    static int sweep(int[][] bookings) {
        int n = bookings.length;
        int[] s = new int[n], e = new int[n];
        for (int i = 0; i < n; i++) { s[i] = bookings[i][0]; e[i] = bookings[i][1]; }
        Arrays.sort(s); Arrays.sort(e);
        int rooms = 0, best = 0, j = 0;
        for (int i = 0; i < n; i++) {
            while (j < n && e[j] <= s[i]) { j++; rooms--; }
            rooms++;
            best = Math.max(best, rooms);
        }
        return best;
    }

    public static void main(String[] args) {
        int[][] day = {{900, 1000}, {930, 1100}, {1000, 1030}, {1030, 1200}, {1045, 1115}};
        System.out.println("heap: " + minRooms(day) + " rooms, sweep: " + sweep(day) + " rooms");
        int[][] backToBack = {{900, 1000}, {1000, 1100}};
        System.out.println("back to back: " + minRooms(backToBack) + " room");
        System.out.println("none: " + minRooms(new int[0][]) + " rooms");
    }
}
