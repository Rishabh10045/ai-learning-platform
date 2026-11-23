const integerApi = ['Java 21 · Integer', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Integer.html'];
const gfgOutline = ['GfG DSA syllabus · Classes 1–2', 'https://media.geeksforgeeks.org/courses/syllabus/4fba2a7424e0c6195d2a0dc8966739d4.pdf#page=7'];

export const numberAlgorithmTopics = {
  'd-bits-01': {
    notes: [
      'A Java int is a signed 32-bit value. The mask 1 contains a single set bit at position zero. The operation n & 1 discards all other bits. Negative numbers use two’s complement, and parity still depends on this same bit. For example, -3 has an odd low bit and -2 has an even one.',
      'Use | to set a bit, & with the inverse mask to clear it, and ^ to toggle it. For bit 2, the mask is 1 << 2. An XOR with the same operand cancels, so (a ^ b) ^ b restores a. This identity underlies the three steps of an XOR swap.',
      'An XOR swap assumes two distinct storage locations. The first operation clears a value if both indexes alias the same location. Use a guard in the exercise and compare with the simpler temporary-variable swap.'
    ],
    practice: ['Run NumberAlgorithms.java from Day 56 Learn. Add a mask that sets and then clears bit 2 in the number 8.', ['Signed odd and even cases agree with the ordinary parity rule.', 'The swap preserves values for the distinct-index and same-index fixtures.', 'Setting bit 2 changes 8 to 12. Clearing it restores 8.']],
    interview: [
      ['Why does n & 1 work for negative ints?', 'Even in two’s complement, an even value ends in a zero bit and an odd value ends in a one bit. The mask examines only that position.'],
      ['What goes wrong when the XOR swap uses the same index twice?', 'The first step XORs the value with itself, writing zero before any original value can be restored.'],
      ['How do you clear bit k while preserving the other bits?', 'AND the number with the bitwise complement of the mask 1 << k, assuming k is within the bit width.']
    ],
    takeaways: ['Parity is a low-bit property.', 'Choose a mask for one explicit operation.', 'Check aliasing before mutating multiple positions.'],
    check: ['Which bit operation toggles just the selected bit?', ['AND with the mask', 'XOR with the mask', 'OR with the mask', 'NOT of the mask'], 1, 'The XOR changes a bit only where the mask is one.'],
    references: [['JLS 21 · Integer bitwise operators', 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.22.1'], gfgOutline]
  },
  'd-bases-01': {
    notes: [
      'A radix changes the weight of each written digit. In hexadecimal, 2A means 2 × 16 + 10, or 42 in decimal. The same integer renders as 101010 in binary and 52 in octal. The text changes and the mathematical value stays the same.',
      'To parse by hand, start at zero and update the value as accumulated × radix + digit. For 2A in radix 16, the partial values are 2 and 42. Validate that each digit belongs to the radix and that the resulting magnitude fits the chosen output type.',
      'Java source literals can use 0b, 0x and a leading zero for octal. Runtime input has its own contract. Integer.parseInt("052", 10) gives 52 because the caller chose radix 10. Integer.parseInt("52", 8) gives 42. Keep signed input, fixed-width bit rendering and parsing rules explicit.'
    ],
    practice: ['Run the Day 56 round-trip fixtures, then implement a manual parser for nonnegative binary text and compare its output against Integer.parseInt.', ['101010 parses to 42. The text 102 is rejected.', '80000000 in hexadecimal exceeds the positive signed int range.', 'Explain why a literal 052 and the runtime decimal string "052" produce different values.']],
    interview: [
      ['How does 2A convert to decimal?', 'Interpret A as digit 10. Multiply the leading digit by 16 and add 10 to obtain 42.'],
      ['What errors should a base parser distinguish?', 'Invalid radix, malformed input or invalid digits, and values outside the selected numeric range. The API can report several through the same exception type.'],
      ['What does a base round trip prove?', 'Formatting a value in a declared radix and parsing the resulting text in that same radix preserves the value within the supported range.']
    ],
    takeaways: ['Use place value to explain a conversion.', 'Make the radix explicit at input boundaries.', 'Test illegal digits and range overflow.'],
    check: ['What does Integer.parseInt("52", 8) return?', ['52', '42', 'An error', '82'], 1, 'Five eights plus two gives 42.'],
    references: [integerApi, gfgOutline]
  },
  'd-primes-01': {
    notes: [
      'A prime integer is at least two and has exactly two positive divisors. Handle zero, one and negative input first. Two is prime. Other even integers are composite. After those checks, trial division can examine odd divisors only.',
      'If d × q equals n and both d and q are greater than the square root of n, their product would exceed n. Any composite number therefore has a divisor at or below that bound. Use d <= n / d for positive trial divisors to avoid a multiplication overflow. Including equality detects prime squares such as 49.',
      'For n=49, test 3, 5 and 7. The last candidate divides 49. For one query the loop uses O(sqrt(n)) time and O(1) extra space. When many queries share a reasonably small upper bound, prepare a reusable sieve instead.'
    ],
    practice: ['Run the Day 56 primality fixtures, then record the divisors tested for 49 and 53.', ['0 and 1 fail, 2 succeeds, 49 fails at 7 and 53 passes.', 'The large positive boundary avoids a wrapped bound expression.']],
    interview: [
      ['Why do you check up to and including the square root?', 'At least one divisor of a composite is at or below it, and a perfect square can have its first factor exactly on that boundary.'],
      ['How does d <= n / d help in Java?', 'For positive integers it expresses the same square-root test without evaluating a possibly overflowing multiplication.'],
      ['When would you choose a different method?', 'Use a sieve for a dense bounded query range. Large sparse inputs can use a suitable primality algorithm based on the size and correctness requirements.']
    ],
    takeaways: ['Handle numbers below two and even inputs first.', 'Use an inclusive divisor bound.', 'Choose by query workload and supported range.'],
    check: ['Which fixture specifically detects a strict rather than inclusive square-root check?', ['1', '49', '53', '2'], 1, '49’s first proper divisor is 7, exactly its square root.'],
    references: [gfgOutline]
  },
  'd-sieve-01': {
    notes: [
      'A sieve represents the integers from zero through an inclusive bound in an indexed array. Use a composite flag and collect unmarked values starting at two. Input below two returns an empty result. The bound controls memory, so a dense table is appropriate only when the array fits.',
      'Scan p from two through the square-root bound. When p survives previous marking it is prime. Mark p² and further multiples in steps of p. Every smaller composite multiple of p had a smaller factor and has already been marked. Through 30, the pass for 2 starts at 4, the pass for 3 at 9, and the pass for 5 at 25.',
      'The boolean-array implementation takes O(N log log N) time and O(N) working space. For repeated queries retain the flag table and check each candidate in constant time. For sparse queries or a very large upper bound choose a different approach or use a segmented sieve when a full prime listing is needed.'
    ],
    practice: ['Run the exact Day 56 Java sieve and diagram. Capture the start of each marking pass and compare the result with trial division.', ['The primes through 30 match the ten expected values in the day fixture.', 'Bounds 0 and 1 return no values. Bound 2 includes 2.', 'The sieve matches trial division for every bound from 0 to 100.']],
    interview: [
      ['Why can the p pass start at p²?', 'Any earlier composite multiple is p times a factor smaller than p, which has a smaller prime factor. That earlier prime processed it.'],
      ['Why does the outer loop stop at the square root?', 'Every composite within the limit has a prime factor at or below that bound. Later primes can still appear in the collected result.'],
      ['How does the sieve serve repeated queries?', 'Reuse the marked table and handle numbers below two separately, then use the candidate as an array index within the checked bound.']
    ],
    takeaways: ['Define an inclusive bound and memory budget.', 'Mark from p² using a safe intermediate type.', 'Cross-check against a simpler algorithm for small bounds.'],
    check: ['What is the first new candidate when p=5 is processed?', ['10', '20', '25', '15'], 2, 'All smaller composite multiples of 5 have already been handled by 2 or 3.'],
    references: [['GfG · Sieve of Eratosthenes', 'https://www.geeksforgeeks.org/dsa/sieve-of-eratosthenes/'], gfgOutline]
  },
  'd-lcm-01': {
    notes: [
      'Euclid’s algorithm preserves the greatest common divisor when replacing (a,b) with (b,a mod b). For example, (54,24) becomes (24,6), then (6,0), which returns 6. In this lab the input domain is nonnegative. GCD(0,0) returns 0 by the chosen convention.',
      'For positive numbers, lcm(a,b) = (a / gcd(a,b)) × b. Dividing first avoids a larger intermediate product. The resulting LCM can still overflow long, so use Math.multiplyExact for the selected contract. A zero operand gives zero.',
      'Fold an array from the multiplicative identity 1. For [6,10,15] the running result is 6, then 30, then 30. Detect a zero and validate all values before the fold so the mathematical result remains zero even if a positive prefix would have overflowed.'
    ],
    practice: ['Run the Day 56 Euclid and LCM checks. Add a trace for [4,6,9] and rearrange the zero/overflow fixture.', ['The trace ends at 36 and the empty fold returns 1.', 'A zero anywhere in the nonnegative array gives zero.', 'A genuinely excessive positive result raises ArithmeticException.']],
    interview: [
      ['Why does Euclid preserve the GCD after a remainder step?', 'A common divisor of a and b also divides their remainder, and a divisor of b and that remainder divides a again.'],
      ['Why divide by the GCD before multiplying?', 'The division reduces one operand and gives the same mathematical result with a smaller intermediate value. Check the final multiplication as well.'],
      ['Why inspect the whole array when it may contain zero?', 'The mathematical LCM is zero if any operand is zero. Folding a positive prefix could otherwise overflow before discovering the zero.']
    ],
    takeaways: ['Trace the remainder step to zero.', 'Declare the zero and empty-input contracts.', 'Use checked arithmetic for the result type.'],
    check: ['What is the LCM of [6,10,15]?', ['150', '30', '60', '900'], 1, '30 is divisible by all three and the positive fold reaches it after the first two terms.'],
    references: [['Java 21 · Math.multiplyExact', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html#multiplyExact(long,long)'], gfgOutline]
  }
};
