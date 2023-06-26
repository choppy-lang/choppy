# How I'm Going To Make This

1. Scan split code and create tokens for each phrase (like "true" and "if" and "0" and etc.)

2. Store the line and col numbers of the first char of the phrase in the token

3. Parse the tokens to generate an AST

4. On error use line & col numbers to generate informative error
