public class EuclidGcd {
    // Euclid: gcd(a, b) = gcd(b, a mod b), and gcd(a, 0) = |a|. Each step at least halves the larger value every two steps.
    // Signs are removed only at the end with absExact: |Long.MIN_VALUE| = 2^63 does not fit in a long,
    // so gcd(MIN_VALUE, 0) throws instead of silently returning a negative number (Math.abs would).
    static long gcd(long a, long b) {
        while (b != 0) { long r = a % b; a = b; b = r; }
        return Math.absExact(a);
    }

    static String trace(long a, long b) {
        StringBuilder sb = new StringBuilder();
        while (b != 0) { sb.append("gcd(").append(a).append(", ").append(b).append(") -> "); long r = a % b; a = b; b = r; }
        return sb.append(a).toString();
    }

    // Extended Euclid: returns {g, x, y} with a*x + b*y = g.
    static long[] extended(long a, long b) {
        if (b == 0) return new long[] {a, 1, 0};
        long[] r = extended(b, a % b);
        return new long[] {r[0], r[2], r[1] - (a / b) * r[2]};
    }

    // LCM: divide before multiplying to keep the intermediate small; absExact and multiplyExact guard overflow.
    static long lcm(long a, long b) {
        if (a == 0 || b == 0) return 0;
        return Math.multiplyExact(Math.absExact(a / gcd(a, b)), Math.absExact(b));
    }

    public static void main(String[] args) {
        System.out.println(trace(252, 105));
        System.out.println("gcd(-48, 18) = " + gcd(-48, 18) + ", gcd(0, 7) = " + gcd(0, 7) + ", gcd(0, 0) = " + gcd(0, 0));
        long[] e = extended(240, 46);
        System.out.println("240*(" + e[1] + ") + 46*(" + e[2] + ") = " + e[0]);
        System.out.println("lcm(4, 6) = " + lcm(4, 6) + ", lcm(21, 6) = " + lcm(21, 6));
        try {
            lcm(4_000_000_007L, 4_000_000_009L);
        } catch (ArithmeticException ex) {
            System.out.println("lcm of two large coprimes: " + ex.getMessage());
        }
        System.out.println("gcd(MIN_VALUE, 2) = " + gcd(Long.MIN_VALUE, 2));
        for (long[] p : new long[][] {{Long.MIN_VALUE, 0}, {Long.MIN_VALUE, 1}}) {
            try {
                System.out.println("unexpected: " + (p[1] == 0 ? gcd(p[0], p[1]) : lcm(p[0], p[1])));
            } catch (ArithmeticException ex) {
                System.out.println((p[1] == 0 ? "gcd(MIN_VALUE, 0)" : "lcm(MIN_VALUE, 1)") + " rejected: 2^63 does not fit in a long (" + ex.getMessage() + ")");
            }
        }
    }
}
