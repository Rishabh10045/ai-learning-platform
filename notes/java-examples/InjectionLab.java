import java.util.*;
import java.util.function.Function;

// Day 9 main lab: constructor injection, a tiny application context that fails fast at startup, and a
// fake-repository test. This is a plain-Java MODEL of what Spring's context does; no Spring jar is used.
public class InjectionLab {
    interface SeatRepository { boolean claimIfFree(String seat, String user); }
    interface Clock { long now(); }

    // Constructor injection: dependencies are final, visible in the signature, and required to build the object.
    static final class BookingService {
        private final SeatRepository seats; private final Clock clock;
        BookingService(SeatRepository seats, Clock clock) {
            this.seats = Objects.requireNonNull(seats, "seats"); this.clock = Objects.requireNonNull(clock, "clock");
        }
        String book(String seat, String user) { return seats.claimIfFree(seat, user) ? "201 " + seat + " at t=" + clock.now() : "409 " + seat; }
    }

    static final class InMemorySeats implements SeatRepository {
        private final Map<String, String> owners = new HashMap<>();
        public boolean claimIfFree(String seat, String user) { return owners.putIfAbsent(seat, user) == null; }
    }

    // A minimal "application context": bean definitions are factories; refresh() builds every singleton once,
    // in dependency order, and fails at startup if a dependency is missing (Spring: NoSuchBeanDefinitionException).
    static final class Context {
        private final Map<Class<?>, Function<Context, ?>> definitions = new LinkedHashMap<>();
        private final Map<Class<?>, Object> singletons = new LinkedHashMap<>();
        private final List<String> creationOrder = new ArrayList<>();
        <T> Context define(Class<T> type, Function<Context, T> factory) { definitions.put(type, factory); return this; }
        <T> T get(Class<T> type) {
            Object existing = singletons.get(type);
            if (existing != null) return type.cast(existing);
            Function<Context, ?> f = definitions.get(type);
            if (f == null) throw new IllegalStateException("No bean of type " + type.getSimpleName());
            T bean = type.cast(f.apply(this));
            singletons.put(type, bean); creationOrder.add(type.getSimpleName());
            return bean;
        }
        Context refresh() { for (Class<?> t : definitions.keySet()) get(t); return this; }
    }

    public static void main(String[] args) {
        // 1. Wire the "production" context. Definition order does not matter; dependencies are resolved on demand.
        Context ctx = new Context()
            .define(BookingService.class, c -> new BookingService(c.get(SeatRepository.class), c.get(Clock.class)))
            .define(SeatRepository.class, c -> new InMemorySeats())
            .define(Clock.class, c -> () -> 1000L)
            .refresh();
        System.out.println("creation order: " + ctx.creationOrder);
        System.out.println("singleton: " + (ctx.get(BookingService.class) == ctx.get(BookingService.class)));
        System.out.println(ctx.get(BookingService.class).book("A1", "U1"));

        // 2. A missing bean fails when the context starts, not on the first user request.
        try {
            new Context().define(BookingService.class, c -> new BookingService(c.get(SeatRepository.class), c.get(Clock.class))).refresh();
            System.out.println("context started (wrong)");
        } catch (IllegalStateException e) {
            System.out.println("startup failed fast: " + e.getMessage());
        }

        // 3. Unit test without any container: pass a fake repository and a fixed clock through the constructor.
        SeatRepository alwaysTaken = (seat, user) -> false;
        BookingService underTest = new BookingService(alwaysTaken, () -> 42L);
        System.out.println("fake repo says taken -> " + underTest.book("A1", "U2"));
        try { new BookingService(null, () -> 0L); } catch (NullPointerException e) { System.out.println("null dependency rejected: " + e.getMessage()); }
    }
}
