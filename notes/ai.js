export const aiNotes = {
  35: {
    sections: [
      ['From training to language generation',
        'During training, examples contribute to a loss that guides adjustments to model weights. A feedforward network transforms inputs through layers of learned weights and nonlinear functions. Backpropagation computes how changing the weights affects the error. CNNs exploit local patterns, RNNs carry sequential state and transformers use attention to relate positions in a sequence. You can learn these concepts without training a model yourself.',
        'During inference, a tokenizer converts text into model units. An LLM predicts a distribution for a next token, extending the context repeatedly until output stops. Self-attention lets a transformer mix information from context positions. A selected output can vary with model, prompt, sampling parameters and context. The length limit covers tokenized input and output according to the provider’s rules.'],
      ['Select a model through a task',
        'For a policy-help feature, compare answer grounding, valid output format, latency, privacy and cost on the same fixtures. Include one question outside the supplied policy. Model cards and vendor documentation describe setup and reference limits, while your own scenarios reveal behavior that matters to the product. Keep the booking operation authoritative and deterministic.']
    ],
    quick: ['Training updates weights; inference uses the weights.', 'Token limits affect prompt and response budgets.', 'Compare models with the same test inputs.'],
    variation: 'A larger model is more fluent and slower, while both fail when no relevant policy is supplied. What would you change first?',
    check: 'Trace one request from input tokens to output and justify a model decision using a representative task.'
  },
  36: {
    sections: [
      ['Specify output and boundaries',
        'A prompt can define the task, audience, input delimiters and allowed answer formats. Give one representative example and a rule for insufficient evidence. The output schema might require answer, sourceIds and an answerability flag. Structured output helps the app parse fields, while business validation checks whether those values are permitted and supported.',
        'Use an empty source list and an explicit fallback when the application cannot support an answer. For example, a response can be valid JSON and still invent a refund period. Compare the stated refund period with allowed values or supplied policy evidence. Validate the semantics that matter before displaying the response.'],
      ['Keep the exercise deterministic',
        'Start with fixtures for a valid answer, a malformed response and a schema-valid but unsupported answer. Map them through the same Java validation layer. Capture accepted and rejected outcomes. Use a bounded retry only when you can describe why the next attempt is likely to help.']
    ],
    quick: ['Specify both the task and the schema.', 'Shape validation and claim validation answer different questions.', 'Test invalid fixtures before making a paid call.'],
    variation: 'A schema-valid response cites policy P9, but only P1 and P2 were supplied. What should the validator check and return?',
    check: 'Show which fixture passes shape validation, which passes grounding validation and where fallback occurs.'
  },
  37: {
    sections: [
      ['Give the model a replaceable adapter',
        'The help application depends on an interface that accepts a question and evidence and returns a candidate. A Spring AI ChatClient implementation can map this request to a provider model, while a fixture implementation returns stable values in tests. Choose configuration at runtime and keep network clients and credentials outside the domain model.'],
      ['Make failures observable and bounded',
        'A timeout, provider rate limit and malformed output call for different handling. Keep the request deadline and retry policy explicit. Report meaningful failure categories and measure duration without storing sensitive raw prompts by default. Return a deterministic help fallback when validation or the provider fails.',
        'The model adapter serves policy help. Booking writes use the domain service and database rules. Test these paths independently and include an unavailable provider fixture to show that booking still works. A live model is optional for this session.']
    ],
    quick: ['Use an interface with fixture and provider implementations.', 'Treat timeout and invalid output as separate cases.', 'Keep booking logic independent of help generation.'],
    variation: 'Your provider’s API response changes its text format. Which layer should absorb the change, and which tests should catch it?',
    check: 'Run success, timeout and invalid-output tests with a controlled adapter and explain the fallback.'
  },
  38: {
    sections: [
      ['Represent meaning and find candidates',
        'An embedding model converts an input into a vector. Similarity tries to rank nearby representations. Cosine similarity compares vector directions, while dot product also depends on magnitude unless values are normalized. Use the same appropriate embedding space for documents and queries. Text IDs carry metadata that the vectors alone cannot enforce.'],
      ['Understand retrieval failures',
        'Split documents into passages that preserve a useful unit of meaning. A small fixture with refund policy, venue map and booking expiry gives expected reference matches. Evaluate top-k results with known relevant passages. A query can retrieve near matches that are obsolete, unauthorized or merely similar in wording. Apply filters or reranking where appropriate.'],
      ['Combine lexical and semantic inputs',
        'Keyword lookup is helpful for exact terms such as policy numbers. Semantic retrieval helps when the question paraphrases the policy. A hybrid design can combine ranks and requires testing on distinct query types. Record retrieval errors before deciding whether the generation model needs a change.']
    ],
    quick: ['Use consistent embedding spaces.', 'Measure retrieval before changing text generation.', 'Filter by policy metadata and scope.'],
    variation: 'A user searches for an exact cancellation code that vector similarity misses. How would you improve candidate retrieval?',
    check: 'Explain a ranked result, one retrieval miss and one case where exact matching helps.'
  },
  39: {
    sections: [
      ['Build a grounded answer path',
        'Retrieval-augmented generation retrieves passages at request time and supplies them as context when asking the model for a candidate answer. Use a small, versioned set of policy excerpts with stable passage IDs. The model can answer using supplied passages or signal insufficient evidence. A deterministic layer checks source IDs and high-impact fields before displaying a result.',
        'Trace the pipeline from question to retrieval, prompt, candidate and validation. For an expiry question, retrieve the specific hold policy and preserve its effective version. An answer can mistake a similar cancellation rule for the hold rule, so include both in a controlled test.'],
      ['Distinguish retrieval from generation failures',
        'A missing relevant passage is a retrieval failure. An unsupported claim after the correct passage arrives is a generation or validation failure. Evaluate both independently and record fallback behavior for unanswerable questions. Keep the Java service’s authoritative booking result outside the generated text.']
    ],
    quick: ['Retrieve, generate and validate as distinct stages.', 'Citations must refer to supplied passages.', 'Support an insufficient-evidence fallback.'],
    variation: 'A correct passage and an outdated conflicting passage both enter the prompt. How should version metadata affect retrieval and display?',
    check: 'Show an answer backed by passage IDs and a fallback for a genuinely unanswerable fixture.'
  },
  40: {
    sections: [
      ['Define measurable quality',
        'A small labeled set should include typical, ambiguous and unanswerable questions. Record expected relevant passages, required claims and the fallback policy. Hit@k measures the share of answerable questions for which the top k includes at least one labeled relevant passage. For questions that need several passages, recall@k measures the fraction of all labeled relevant passages retrieved. Separately evaluate whether the generated claims are supported and whether unsupported questions get the required fallback.'],
      ['Choose deterministic checks where possible',
        'A rule can validate an allowed reference, check that a JSON field exists and compare exact dates or policy codes. Subjective clarity can be reviewed by a human or compared with a model evaluator using a calibrated rubric. A model evaluator can be wrong, so keep examples showing when its decisions disagree with human review.'],
      ['Observe operational behavior',
        'Track latency distributions, fallbacks, invalid output rates and token or usage estimates. Compare changes on the same fixture set before promoting them. Review a few failures manually to decide whether the next improvement belongs in retrieval, prompt design, output checks or provider configuration.']
    ],
    quick: ['Include ambiguity and unanswerable cases.', 'Log outcomes and latency with reproducible versions.', 'Treat model-based grading as evidence to calibrate.'],
    variation: 'The answer acceptance rate rises after shortening the maximum output length, but more supported answers get rejected. What measures would reveal the trade-off?',
    check: 'Produce a small evaluation table and trace two failures to their appropriate layer.'
  },
  41: {
    sections: [
      ['Distinguish tool requests from execution',
        'A model can propose a tool name and structured arguments. The application decides whether the authenticated caller may invoke that tool, validates arguments and handles the result as data. A tool that retrieves a read-only policy excerpt has a narrower effect than a booking action. Use least privilege and keep sensitive operations behind a deterministic boundary.',
        'MCP standardizes how clients and servers expose capabilities such as tools and resources. It can carry a capability description and a request. Application authorization, input validation, audit and side-effect rules still apply. Dependencies returning untrusted data must be treated accordingly.'],
      ['Trace an approved lookup',
        'Start with a tool that takes a known policy ID and returns a single allowed excerpt. Draw the argument validation, access policy, timeout and output check. Simulate an unknown ID and a request exceeding scope. Record which component rejected each case and why.']
    ],
    quick: ['The model proposes a tool call.', 'The application makes the authorization decision.', 'A protocol standardizes the exchange of requests and results.'],
    variation: 'The same tool exposes venue-specific policies. Where do you enforce the caller’s allowed venue on every lookup?',
    check: 'Draw a narrow read-only tool call and demonstrate that invalid or out-of-scope arguments are rejected.'
  },
  42: {
    sections: [
      ['Treat external content as input',
        'Retrieved documents can contain text that sounds like operational instructions. Pass passages as bounded data for citation and keep tool access and authorization in application code. In a defensive fixture, include a passage that tries to redirect the assistant away from the supplied policy. Verify the app rejects unsupported output and records that reason.',
        'Use a finite input budget, controlled context, explicit model deadline and fallback. Repeated model calls cost time and may incur charges. Limit retries and apply a budget at the request boundary. A successful model response still goes through structured and business validation.'],
      ['Balance behavior against measurable objectives',
        'Set a target for p95 help latency and a maximum request size. Compare a normal request and an oversized or unavailable request. Document what storage and logs are needed for diagnosis and what text should remain outside them. Separate booking availability from optional model availability.']
    ],
    quick: ['Treat retrieved text as untrusted data.', 'Control timeout, request size and retries.', 'Test fallback independently of booking.'],
    variation: 'A long request consumes the entire token budget before policy evidence is added. What should be truncated or rejected?',
    check: 'Run bounded normal and failure fixtures and explain where the application enforces its limits.'
  },
  43: {
    sections: [
      ['Diagnose the behavior before customizing',
        'Changing facts often belong in a maintained knowledge source. Prompt changes can improve task framing and output conventions. Fine-tuning adjusts parameters using training examples and can help stable task behavior when you can measure it. A model tuned last month can still give an outdated cancellation policy after the rules change.'],
      ['Compare the lifecycle costs',
        'Retrieval adds indexing, document versions and relevance evaluation. Prompt changes require versioning and regression checks. Fine-tuning adds a dataset, evaluation holdout, training cost, deployment and ongoing regression risk. Parameter-efficient methods such as LoRA adapt a subset of parameters. Understand why the task justifies that extra work before writing any training code.',
        'Write a decision record around one observed failure, then choose the smallest change with a measurable improvement. Keep model and retrieval experiments separate where possible. The Java backend can call a separately trained model through the same provider-facing interface when such training becomes useful.']
    ],
    quick: ['First diagnose whether the failure is about behavior or knowledge.', 'Compare retrieval, prompting and customization against an evaluation set.', 'Training can be a separate optional workflow.'],
    variation: 'Retrieval supplies the right policy every time, but the model repeatedly chooses a poor writing style. What experiment would you run before fine-tuning?',
    check: 'Give one failure diagnosis, one measured alternative and one reason to choose or defer customization.'
  },
  44: {
    sections: [
      ['Prove the critical paths end to end',
        'Start with a deterministic seed, two application processes and one database. Record the commands for a normal booking and a competing booking. Demonstrate that the booking rule survives an availability cache hit and a lost response replay. Trace event delivery separately from the booking commit.'],
      ['Show optional help behavior honestly',
        'Provide a policy question with one supported answer, then simulate missing evidence or an unavailable model. Record whether the help feature falls back and the booking endpoint still works. Save relevant logs and test output. Make it possible for another developer to reproduce the fixture.'],
      ['Defend one trade-off',
        'Explain why the database owns the booking transition, what you measured and how one new scenario would change your strategy. Use precise language about a local lab, test environment and measured behavior. State the limitations of the traffic sample and optional model setup.']
    ],
    quick: ['Reproduce setup from a clean fixture.', 'Show consistency and fallback evidence.', 'Pick a measured trade-off to explain.'],
    variation: 'Temporary holds are acceptable for browsing, but users now require cross-region confirmation. Which part of the design must change first?',
    check: 'Run the booking and help demonstrations and connect every claim to a reproducible observation.'
  },
  45: {
    sections: [
      ['Make a technical answer follow the evidence',
        'Start with the problem and the constraint. Describe the implementation you actually ran, then give a result and one limitation. For example, explain the race observed with two threads, the committed row after the fix and which component protected the invariant. Observations from a controlled fixture should be labeled as such.'],
      ['Use a changed scenario to test understanding',
        'An interviewer may switch the problem from one JVM to two processes, or place a cache and model provider in the path. Identify which assumption changed before adjusting the solution. Give a short correct baseline, then expand on the one trade-off that matters to the question.',
        'Choose one independent exercise you have already studied. On completion, review correctness, depth, delivery and evidence separately. Preserve whether an answer was independent or required hints. Write a concise correction and schedule a revisit.']
    ],
    quick: ['State your exact responsibility and evidence.', 'Name the changed assumption before proposing a new design.', 'Practice a clear answer in your own words.'],
    variation: 'Your lab proves one user wins under a contention test, but an interviewer asks whether this proves resilience under production load. How will you answer?',
    check: 'Give a concise explanation, a concrete test result and a defensible limitation, then solve a related exercise independently.'
  }
};
