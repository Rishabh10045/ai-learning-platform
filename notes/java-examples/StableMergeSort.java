import java.util.*;

// Merge sort on records: taking the LEFT item on equal keys keeps arrival order (stable).
public class StableMergeSort {
    record Req(int priority, String arrival) {}

    static List<Req> sort(List<Req> a, boolean leftOnTie) {
        if (a.size() <= 1) return a;
        int mid = a.size() / 2;
        List<Req> l = sort(a.subList(0, mid), leftOnTie), r = sort(a.subList(mid, a.size()), leftOnTie);
        List<Req> out = new ArrayList<>(a.size());           // O(n) buffer per merge level
        int i = 0, j = 0;
        while (i < l.size() && j < r.size()) {
            int c = Integer.compare(l.get(i).priority(), r.get(j).priority());
            if (c < 0 || (c == 0 && leftOnTie)) out.add(l.get(i++)); else out.add(r.get(j++));
        }
        while (i < l.size()) out.add(l.get(i++));
        while (j < r.size()) out.add(r.get(j++));
        return out;
    }

    static String show(List<Req> xs) {
        StringBuilder sb = new StringBuilder();
        for (Req x : xs) sb.append(x.priority()).append(x.arrival()).append(' ');
        return sb.toString().trim();
    }

    public static void main(String[] args) {
        List<Req> in = List.of(new Req(15, "A"), new Req(10, "B"), new Req(15, "C"), new Req(5, "D"), new Req(10, "E"));
        System.out.println("input            : " + show(in));
        System.out.println("stable (left tie): " + show(sort(in, true)));
        System.out.println("right on tie     : " + show(sort(in, false)) + "  <- 10E before 10B, 15C before 15A");
        List<Req> lib = new ArrayList<>(in);
        lib.sort(Comparator.comparingInt(Req::priority));   // List.sort on objects is a stable merge sort (TimSort)
        System.out.println("List.sort        : " + show(lib));
        System.out.println("empty / one      : [" + show(sort(List.of(), true)) + "] [" + show(sort(List.of(new Req(1, "Z")), true)) + "]");
    }
}
