public class Foundations {
    static final class Seat {
        private static int created = 0;          // one counter shared by the class
        private final String id;                 // set once, in the constructor
        private String owner;                    // changes only through claim()

        Seat(String id) {
            if (id == null || id.isBlank()) throw new IllegalArgumentException("seat id required");
            this.id = id;                        // this.id = field, id = parameter
            created++;
        }
        Seat() { this("A1"); }                   // delegate to the validating constructor

        boolean claim(String userId) {
            if (userId == null || userId.isBlank()) throw new IllegalArgumentException("user id required");
            if (owner != null) return false;
            owner = userId;
            return true;
        }
        String owner() { return owner; }
        static int created() { return created; }
    }

    public static void main(String[] args) {
        int a = 5; int b = a; b++;               // primitives copy the value
        Seat s1 = new Seat("A1"); Seat s2 = s1;  // references copy the arrow, not the object
        s2.claim("U1");
        Seat other = new Seat();
        System.out.println("a=" + a + " b=" + b);
        System.out.println("s1.owner=" + s1.owner() + " sameObject=" + (s1 == s2));
        System.out.println("other.owner=" + other.owner() + " created=" + Seat.created());
    }
}
