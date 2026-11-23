import java.time.LocalDate;
import java.util.*;

// Day 11 main lab: two validation layers and one error format.
// HTTP layer: shape of the request (required fields, formats) -> 400 with every field error at once.
// Domain layer: business rules that need state (past show, seat limit, seat taken) -> 422 or 409.
// Errors use the RFC 9457 problem-details fields: type, title, status, detail, plus an "errors" extension.
public class ValidationLab {
    record BookingRequest(String showId, String seat, String user, String date, int quantity) {}
    record Problem(int status, String title, String detail, List<String> errors) {
        String json() {
            return "{\"type\":\"about:blank\",\"title\":\"" + title + "\",\"status\":" + status + ",\"detail\":\"" + detail + "\""
                + (errors.isEmpty() ? "" : ",\"errors\":[" + String.join(",", errors.stream().map(e -> "\"" + e + "\"").toList()) + "]") + "}";
        }
    }
    static final class DomainException extends RuntimeException {
        final int status; DomainException(int status, String msg) { super(msg); this.status = status; }
    }

    // Layer 1: request shape only. No database, no clock-dependent rules. Collect ALL field errors.
    static List<String> validateShape(BookingRequest r) {
        List<String> errors = new ArrayList<>();
        if (r.showId() == null || r.showId().isBlank()) errors.add("showId: required");
        if (r.seat() == null || !r.seat().matches("[A-Z][0-9]{1,2}")) errors.add("seat: must look like A1..Z99");
        if (r.user() == null || r.user().isBlank()) errors.add("user: required");
        try { LocalDate.parse(String.valueOf(r.date())); } catch (Exception e) { errors.add("date: must be YYYY-MM-DD"); }
        if (r.quantity() < 1) errors.add("quantity: must be at least 1");
        return errors;
    }

    // Layer 2: the service enforces business rules for EVERY caller (HTTP, batch job, message consumer).
    static final class BookingService {
        final LocalDate today; final Set<String> taken = new HashSet<>(Set.of("S1/A1"));
        BookingService(LocalDate today) { this.today = today; }
        String book(BookingRequest r) {
            if (LocalDate.parse(r.date()).isBefore(today)) throw new DomainException(422, "show date " + r.date() + " is in the past");
            if (r.quantity() > 6) throw new DomainException(422, "at most 6 seats per booking");
            if (taken.contains(r.showId() + "/" + r.seat())) throw new DomainException(409, "seat " + r.seat() + " is already booked");
            taken.add(r.showId() + "/" + r.seat());
            return "201 booked " + r.showId() + "/" + r.seat();
        }
    }

    // The "controller": translate each failure to one status and one body shape.
    static String handle(BookingService service, BookingRequest r) {
        List<String> shape = validateShape(r);
        if (!shape.isEmpty()) return "400 " + new Problem(400, "Invalid request", shape.size() + " field error(s)", shape).json();
        try { return service.book(r); }
        catch (DomainException e) { return e.status + " " + new Problem(e.status, e.status == 409 ? "Conflict" : "Unprocessable booking", e.getMessage(), List.of()).json(); }
    }

    public static void main(String[] args) {
        BookingService service = new BookingService(LocalDate.of(2026, 12, 2));
        System.out.println(handle(service, new BookingRequest("S1", "A2", "U1", "2026-12-05", 1)));
        System.out.println(handle(service, new BookingRequest("", "a-1", "U1", "05/12/2026", 0)));
        System.out.println(handle(service, new BookingRequest("S1", "A3", "U1", "2026-11-30", 1)));
        System.out.println(handle(service, new BookingRequest("S1", "A4", "U1", "2026-12-05", 9)));
        System.out.println(handle(service, new BookingRequest("S1", "A1", "U2", "2026-12-05", 1)));
        // A non-HTTP caller skips layer 1, and the service still refuses a past date.
        try { service.book(new BookingRequest("S1", "B1", "batch", "2026-01-01", 1)); }
        catch (DomainException e) { System.out.println("batch caller -> " + e.status + " " + e.getMessage()); }
    }
}
