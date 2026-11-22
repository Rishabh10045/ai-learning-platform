import java.lang.reflect.*;
import java.util.*;

public class ProxyBoundary {
    interface BookingService {
        void bookPair(String a, String b);   // public entry point
        void bookOne(String seat);           // also "transactional"
    }

    static final List<String> log = new ArrayList<>();

    static final class BookingServiceImpl implements BookingService {
        public void bookPair(String a, String b) {
            log.add("  write " + a);
            bookOne(b);                       // self-invocation: this.bookOne(), not the proxy
        }
        public void bookOne(String seat) { log.add("  write " + seat); }
    }

    // A JDK dynamic proxy playing the role of Spring's transactional proxy: advice runs around each call it receives.
    static BookingService transactional(BookingService target) {
        InvocationHandler advice = (proxy, method, args) -> {
            log.add("BEGIN tx for " + method.getName());
            try {
                Object result = method.invoke(target, args);
                log.add("COMMIT " + method.getName());
                return result;
            } catch (InvocationTargetException e) {
                log.add("ROLLBACK " + method.getName());
                throw e.getCause();
            }
        };
        return (BookingService) Proxy.newProxyInstance(
                BookingService.class.getClassLoader(), new Class<?>[] { BookingService.class }, advice);
    }

    public static void main(String[] args) {
        BookingService bean = transactional(new BookingServiceImpl());   // what other beans get injected
        System.out.println("bean is a proxy: " + Proxy.isProxyClass(bean.getClass()));

        bean.bookOne("A1");                   // external call: crosses the proxy
        bean.bookPair("B1", "B2");            // external call to bookPair; the inner bookOne does NOT cross it
        log.forEach(System.out::println);
        long begins = log.stream().filter(l -> l.startsWith("BEGIN")).count();
        System.out.println("transactions started: " + begins + " (bookOne inside bookPair got no advice of its own)");
    }
}
