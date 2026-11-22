import java.util.*;

public class StaleKnowledge {
    // Two ways to answer "what is the refund window for venue X?"
    interface Answerer { String answer(String venue); }

    public static void main(String[] args) {
        Map<String, String> policyStore = new HashMap<>(Map.of("VENUE-A", "24h", "VENUE-B", "none"));

        // "Fine-tuned": the facts were copied into the weights at training time and do not change afterwards.
        Map<String, String> frozenAtTraining = Map.copyOf(policyStore);
        Answerer tuned = venue -> frozenAtTraining.getOrDefault(venue, "unknown");

        // "Retrieval": every answer reads the maintained source at request time and cites it.
        Answerer rag = venue -> policyStore.getOrDefault(venue, "unknown") + " [source: policyStore/" + venue + "]";

        List<String[]> evalSet = List.of(new String[] {"VENUE-A", "24h"}, new String[] {"VENUE-B", "none"});
        runEval("before change", evalSet, tuned, rag);

        policyStore.put("VENUE-A", "48h");                    // the business edits one policy
        evalSet = List.of(new String[] {"VENUE-A", "48h"}, new String[] {"VENUE-B", "none"});
        runEval("after change", evalSet, tuned, rag);
    }

    static void runEval(String label, List<String[]> evalSet, Answerer tuned, Answerer rag) {
        int tunedOk = 0, ragOk = 0;
        for (String[] c : evalSet) {
            if (tuned.answer(c[0]).equals(c[1])) tunedOk++;
            if (rag.answer(c[0]).startsWith(c[1] + " ")) ragOk++;
        }
        System.out.println(label + ": tuned " + tunedOk + "/" + evalSet.size() + ", retrieval " + ragOk + "/" + evalSet.size()
            + " | VENUE-A tuned=" + tuned.answer("VENUE-A") + " retrieval=" + rag.answer("VENUE-A"));
    }
}
