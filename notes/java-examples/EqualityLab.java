import java.util.*;

// Day 4 main lab: equals/hashCode contract, a mutable-key failure, and correct lookup under forced collisions.
public class EqualityLab {
    // 1. Correct value key: a record gets equals/hashCode from all components, and its fields are final.
    record SeatId(String show, String seat) {}

    // 2. equals overridden but hashCode NOT overridden: breaks the contract (equal objects, different hashes).
    static final class NoHashSeat {
        final String id;
        NoHashSeat(String id) { this.id = id; }
        @Override public boolean equals(Object o) { return o instanceof NoHashSeat s && s.id.equals(id); }
    }

    // 3. Mutable key: hashCode depends on a field that can change after the key is stored.
    static final class MutableSeat {
        String id;
        MutableSeat(String id) { this.id = id; }
        @Override public boolean equals(Object o) { return o instanceof MutableSeat s && s.id.equals(id); }
        @Override public int hashCode() { return id.hashCode(); }
    }

    // 4. Legal but terrible hashCode: every key collides into one bucket. equals still decides the lookup.
    static final class CollidingSeat {
        final String id;
        CollidingSeat(String id) { this.id = id; }
        @Override public boolean equals(Object o) { return o instanceof CollidingSeat s && s.id.equals(id); }
        @Override public int hashCode() { return 42; }
    }

    public static void main(String[] args) {
        Map<SeatId, String> owners = new HashMap<>();
        owners.put(new SeatId("S1", "A1"), "U1");
        SeatId fresh = new SeatId("S1", "A1");                      // a different object with equal fields
        System.out.println("record: same object? " + (fresh == new SeatId("S1", "A1")) + ", equal? " + fresh.equals(new SeatId("S1", "A1")) + ", lookup -> " + owners.get(fresh));

        Set<NoHashSeat> broken = new HashSet<>();
        broken.add(new NoHashSeat("A1"));
        System.out.println("equals without hashCode: contains(equal key)? " + broken.contains(new NoHashSeat("A1")) + " (an equal key is not found: contract broken)");

        Map<MutableSeat, String> byMutable = new HashMap<>();
        MutableSeat key = new MutableSeat("A1");
        byMutable.put(key, "U1");
        key.id = "B7";                                               // mutate the key while it is inside the map
        System.out.println("mutable key after change: get(same object) -> " + byMutable.get(key) + ", get(new A1) -> " + byMutable.get(new MutableSeat("A1")));
        System.out.println("mutable key: size=" + byMutable.size() + ", entry still there when iterating? " + byMutable.containsValue("U1"));

        Map<CollidingSeat, String> colliding = new HashMap<>();
        for (int i = 1; i <= 20; i++) colliding.put(new CollidingSeat("A" + i), "U" + i);
        boolean allFound = true;
        for (int i = 1; i <= 20; i++) allFound &= ("U" + i).equals(colliding.get(new CollidingSeat("A" + i)));
        System.out.println("20 keys, one hash bucket: all lookups correct? " + allFound + ", missing key -> " + colliding.get(new CollidingSeat("Z9")));
    }
}
