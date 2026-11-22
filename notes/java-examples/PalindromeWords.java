public class PalindromeWords {
    // Two pointers from both ends, skipping anything that is not a letter or digit. O(n) time, O(1) space.
    static boolean isPalindrome(String s) {
        int i = 0, j = s.length() - 1;
        while (i < j) {
            char a = s.charAt(i), b = s.charAt(j);
            if (!Character.isLetterOrDigit(a)) { i++; continue; }
            if (!Character.isLetterOrDigit(b)) { j--; continue; }
            if (Character.toLowerCase(a) != Character.toLowerCase(b)) return false;
            i++; j--;
        }
        return true;
    }

    // Reverse word order, collapsing extra spaces. StringBuilder avoids creating a new String per word.
    static String reverseWords(String s) {
        String[] words = s.strip().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int k = words.length - 1; k >= 0; k--) {
            if (words[k].isEmpty()) continue;
            if (sb.length() > 0) sb.append(' ');
            sb.append(words[k]);
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.println("'A man, a plan, a canal: Panama' palindrome: " + isPalindrome("A man, a plan, a canal: Panama"));
        System.out.println("'race a car' palindrome: " + isPalindrome("race a car"));
        System.out.println("'' palindrome: " + isPalindrome(""));
        System.out.println("reverse '  seat A1   is   free ' -> '" + reverseWords("  seat A1   is   free ") + "'");
        String a = "A1", b = new StringBuilder("A").append(1).toString();
        System.out.println("a == b: " + (a == b) + ", a.equals(b): " + a.equals(b));
    }
}
