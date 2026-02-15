DELETE). If omitted, GET is the default.
   2. `-H "<HEADER>"` or `--header "<HEADER>"`: Adds custom HTTP headers to the request. This is
      crucial for sending Content-Type (e.g., application/json) or Authorization tokens.
   3. `-d "<DATA>"` or `--data "<DATA>"`: Sends data in the request body for POST or PUT requests.
      For JSON data, you typically combine this with -H 'Content-Type: application/json'.
   4. `-i` or `--include`: Includes the HTTP response headers in the output. Useful for debugging.
   5. `-v` or `--verbose`: Shows more detailed information about the request and response, including
      connection details and headers.
   6. `--json "<JSON_DATA>"`: A shorthand for -H 'Content-Type: application/json' -d '<JSON_DATA>'.
      (Note: This might not be available in all curl versions, but is common in newer ones.)

  Examples for Your Backend API:

  Assuming your server is running on http://localhost:3000 and API routes are prefixed with /api.

  1. POST Request (Generate KHQR Code)


  This endpoint creates a resource, so it uses POST. It doesn't require a body, but it does need a
  Content-Type header even if the body is empty.


   1 curl -X POST \
   2      -H 'Content-Type: application/json' \
   3      http://localhost:3000/api/orders/someUserId123/generate_qrcode


   * -X POST: Specifies the HTTP POST method.
   * -H 'Content-Type: application/json': Tells the server that the request body (even if empty) is
     expected to be JSON.
   * http://localhost:3000/api/orders/someUserId123/generate_qrcode: The target URL, where
     someUserId123 is a placeholder for your actual user ID.

  2. POST Request with Request Body (Check Payment Status)


  This endpoint also uses POST and requires data (the qr_md5) in the request body.


   1 curl -X POST \
   2      -H 'Content-Type: application/json' \
   3      -d '{ "qr_md5": "your_qr_md5_hash_here" }' \
   4      http://localhost:3000/api/orders/someUserId123/check_payment


   * -X POST: Specifies the HTTP POST method.
   * -H 'Content-Type: application/json': Important for JSON data in the body.
   * -d '{ "qr_md5": "your_qr_md5_hash_here" }': Sends a JSON object as the request body. Replace
     your_qr_md5_hash_here with the actual MD5 hash from a generated QR code.
   * http://localhost:3000/api/orders/someUserId123/check_payment: The target URL.

  ---


  Remember to replace placeholders like someUserId123 and your_qr_md5_hash_here with actual values
  relevant to your scenario.
