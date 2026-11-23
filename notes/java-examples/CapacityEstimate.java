// Day 18 main lab: requirements turned into numbers. Every assumption is a named constant you can change,
// and the program checks the conclusions you would say out loud in an interview.
public class CapacityEstimate {
    public static void main(String[] args) {
        // Functional scope: browse seat maps, hold a seat, confirm a booking. Non-functional: no double booking,
        // seat map p95 < 300 ms, booking p99 < 1 s, 99.9% availability for browsing.
        long dailyActiveUsers = 2_000_000;
        double seatMapViewsPerUser = 10, bookingsPerUser = 0.2;
        double peakFactor = 5;                    // evening peak vs daily average
        int seatsPerShow = 300, bytesPerBooking = 500, retentionYears = 3;

        double secondsPerDay = 86_400;
        double avgReads = dailyActiveUsers * seatMapViewsPerUser / secondsPerDay;
        double avgWrites = dailyActiveUsers * bookingsPerUser / secondsPerDay;
        System.out.printf("average reads/s: %.0f, peak reads/s: %.0f%n", avgReads, avgReads * peakFactor);
        System.out.printf("average bookings/s: %.1f, peak bookings/s: %.0f%n", avgWrites, avgWrites * peakFactor);
        System.out.printf("read:write ratio about %.0f:1%n", seatMapViewsPerUser / bookingsPerUser);

        double bookingsPerYear = dailyActiveUsers * bookingsPerUser * 365;
        double storageGb = bookingsPerYear * retentionYears * bytesPerBooking / 1e9;
        System.out.printf("booking storage for %d years: %.0f GB (fits one PostgreSQL primary)%n", retentionYears, storageGb);

        // Hot key: a blockbuster release. 200k fans open the same show within 60 s; only 300 can win.
        int fans = 200_000, windowSeconds = 60;
        double hotShowReads = fans * 3.0 / windowSeconds, hotShowClaims = fans * 1.0 / windowSeconds;
        System.out.printf("hot show: %.0f seat-map reads/s and %.0f claim attempts/s for %d seats%n", hotShowReads, hotShowClaims, seatsPerShow);
        System.out.printf("losing claims in that minute: %d of %d (%.2f%%)%n", fans - seatsPerShow, fans, 100.0 * (fans - seatsPerShow) / fans);

        boolean readsNeedCache = avgReads * peakFactor > 1_000;
        boolean writesFitOneDb = avgWrites * peakFactor < 5_000;
        System.out.println("decision: cache or CDN for seat maps: " + readsNeedCache + "; one primary for writes: " + writesFitOneDb
            + "; hot show needs a queue or waiting room: " + (hotShowClaims > seatsPerShow * 10));
    }
}
