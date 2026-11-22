import java.util.*;

public class ExpenseSplit {
    // Machine-coding style: small types, one service, a clear rule, and a main that exercises the edge cases.
    record Expense(String paidBy, long amountPaise, List<String> sharedBy) {
        Expense {
            if (amountPaise <= 0) throw new IllegalArgumentException("amount must be positive");
            if (sharedBy.isEmpty()) throw new IllegalArgumentException("nobody shares the expense");
        }
    }

    static final class Ledger {
        private final Map<String, Long> balance = new TreeMap<>();   // + means is owed money, - means owes money

        void add(Expense e) {
            long share = e.amountPaise() / e.sharedBy().size();
            long remainder = e.amountPaise() % e.sharedBy().size();     // leftover paise go to the first sharers
            balance.merge(e.paidBy(), e.amountPaise(), Long::sum);
            for (int i = 0; i < e.sharedBy().size(); i++) {
                long owed = share + (i < remainder ? 1 : 0);
                balance.merge(e.sharedBy().get(i), -owed, Long::sum);
            }
        }

        // Greedy settle-up: the biggest debtor pays the biggest creditor until everyone is at zero.
        List<String> settle() {
            Comparator<Map.Entry<String, Long>> byAmount = Map.Entry.comparingByValue();
            PriorityQueue<Map.Entry<String, Long>> creditors = new PriorityQueue<>(byAmount.reversed().thenComparing(Map.Entry.comparingByKey()));
            PriorityQueue<Map.Entry<String, Long>> debtors = new PriorityQueue<>(byAmount.thenComparing(Map.Entry.comparingByKey()));
            for (var e : balance.entrySet()) {
                if (e.getValue() > 0) creditors.add(new AbstractMap.SimpleEntry<>(e));
                if (e.getValue() < 0) debtors.add(new AbstractMap.SimpleEntry<>(e));
            }
            List<String> transfers = new ArrayList<>();
            while (!creditors.isEmpty()) {
                var c = creditors.poll();
                var d = debtors.poll();
                long amount = Math.min(c.getValue(), -d.getValue());
                transfers.add(d.getKey() + " pays " + c.getKey() + " " + rupees(amount));
                if (c.getValue() - amount > 0) creditors.add(new AbstractMap.SimpleEntry<>(c.getKey(), c.getValue() - amount));
                if (d.getValue() + amount < 0) debtors.add(new AbstractMap.SimpleEntry<>(d.getKey(), d.getValue() + amount));
            }
            return transfers;
        }

        Map<String, Long> balances() { return Collections.unmodifiableMap(balance); }
    }

    static String rupees(long paise) { return String.format("Rs %d.%02d", paise / 100, paise % 100); }

    public static void main(String[] args) {
        Ledger ledger = new Ledger();
        ledger.add(new Expense("asha", 90000, List.of("asha", "ben", "chen")));   // dinner Rs 900, split three ways
        ledger.add(new Expense("ben", 10000, List.of("asha", "ben", "chen")));    // taxi Rs 100: 3334 + 3333 + 3333
        ledger.add(new Expense("chen", 30000, List.of("chen", "dev")));           // tickets Rs 300 for two
        System.out.println("balances (paise): " + ledger.balances());
        System.out.println("sum of balances: " + ledger.balances().values().stream().mapToLong(Long::longValue).sum());
        ledger.settle().forEach(System.out::println);
        try {
            ledger.add(new Expense("dev", 0, List.of("dev")));
        } catch (IllegalArgumentException ex) {
            System.out.println("rejected: " + ex.getMessage());
        }
    }
}
