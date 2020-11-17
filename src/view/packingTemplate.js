const puppeteer = require('puppeteer');

module.exports = async (orderDetails) => {
  let payment_method = '';
  let items = '';

  if (orderDetails.payment_info.payment_method.type == 'card') { payment_method = `${orderDetails.payment_info.payment_method.details.brand} Card ending in  ${orderDetails.payment_info.payment_method.details.last4}`; } else { payment_method = orderDetails.payment_info.payment_method.type; }

  const { billing_address } = orderDetails.payment_info;

  orderDetails.items.map((item) => {
    const deliveryDate = item.deliveryOrder.estimatedDeliveryDate ? item.deliveryOrder.estimatedDeliveryDate : 'N/A';
    items += `
            <tr>
                <td>
                    <img class="product_image" src="${item.image}">
                    <div class="product_name">
                        <p class="line_break"><b>${item.title}</b></p>
                        <span>Estimate Delivery : </span>
                        <span class="delivery_estimate">${deliveryDate}</span>
                    </div>
                </td>
                <td>${item.price.formatted}</td>
                <td>${item.quantity}</td>
                <td>${item.total.formatted}</td>
            </tr>
        `;
  });

  const pdfTemplate = `<!DOCTYPE html>
  <!-- saved from url=(0037)file:///C:/Users/PC/Videos/index.html -->
  <html><head><meta http-equiv="Content-Type" content="text/html; charset=windows-1252">
      <title>INVOICE</title>
      <style>
      @page {
          size: A4;
      }
  
      @page :left {
          margin-left: 1cm;
      }
  
      @page :right {
          margin-left: 1cm;
      }
  
      @page :first {
          margin-top: 1cm;
      }
  
      @media print {
          div {
              break-inside: avoid!important;
              page-break-inside: avoid!important;
          }
      }
  
      #page-header {
          display: block;
          position: running(header);
      }
  
      #page-footer {
          display: block;
          position: running(footer);
      }
  
      body {
          color: #2a2a2a;
          font-family: Helvetica, Arial, sans-serif;
          max-width: 1200px;
          width: 100%;
          margin-top: 1em;
          box-sizing: border-box;
          font-size:16px;
      }
  
      .flex-container {
          margin-left: 5%;
          margin-right: 5%;
          margin-top: 1em;
      }
  
      h1 {
          font-size: 3em;
          margin: 0;
      }
  
      h2 {
          margin-top: 10px;
          font-style: normal;
          font-weight: 500;
          font-size: 30px;
          letter-spacing: 0.25px;
          color: rgba(0, 0, 0, 0.6);
      }
  
      p {
          margin: 0 0 7px;
          color:rgba(0, 0, 0, 0.6)
      }
  
      .flex-box {
          padding: 0;
          margin: 0;
          list-style: none;
          display: flex;
      }
  
      .flex-start {
          justify-content: flex-start;
      }
  
      th,
      td {
          text-align: center;
          table-layout: fixed;
          page-break-inside: avoid;
          display: table-cell;
      }
  
      th {
          background-color: rgba(0, 0, 0, 0.4);
          border: 2px solid rgba(40, 157, 161, 0.490193);
          border-right: 0;
          color: white;
          text-transform: uppercase;
          padding: 10px 10px;
          -webkit-print-color-adjust: exact;
      }
  
      th:nth-child(even) {
          background-color: rgba(0, 0, 0, 0.5);
      }
  
      th:last-child {
          border-right: 2px solid rgba(40, 157, 161, 0.490193);
      }
  
      table td {
          border-bottom: 3px solid lightgray;
          border-collapse: collapse;
          padding: 10px auto;
      }
  
      table tbody tr:nth-child(odd) {
          background-color: #f2f2f2;
          -webkit-print-color-adjust: exact;
      }
  
      table th:first-child {
          width: 60%;
          padding: 10px 20px;
          text-align: left;
      }
  
      table tbody tr td:first-child {
          display: table;
          text-align: left;
      }
  
      table tbody tr td:nth-child(2) {
          text-align: left;
      }
      
      td:empty::after {
          content: "";
      }
  
      span {
          margin-left: 40%;
          color: rgba(0, 0, 0, 0.6)
      }
  
      .product_name span {
          margin: 0;
      }
  
      #logo {
          width: 150px;
      }
  
      #invoice_log {
          padding: 4px 20px;
          background-color: rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(40, 157, 161, 0.490193);
          color: white;
          text-align: center;
          text-transform: uppercase;
          -webkit-print-color-adjust: exact;
      }
  
      #items_table {
          margin-top: 30px;
          border-spacing: 0;
      }
      
      .empty_row {
          height: 20px;
          background-color: white!important;
      }
  
      .empty_row td {
          display: table-cell!important;
      }
  
      .product_image {
          width: 100px;
          height: 100px;
          vertical-align: middle;
          border: 2px solid rgba(40, 157, 161, 0.490193);
          margin: 10px 0;
      }
  
      .product_name {
          display: table-cell;
          width: 100%;
          vertical-align: middle;
          padding: 15px 0;
          padding-right: 5px;
      }
  
      .product_name p {
          margin: 0;
      }
  
      .product_name p:first-child {
          margin-bottom: 5px;
      }
  
      .line_break {
          line-break: anywhere;
          overflow-wrap: break-word;
      }
  
      #price_summary {
          width: 375px;
          float: right;
      }
  
      .price_summary_item {
          width: 275px;
          float: right;
          display: table;
          font-size: 20px;
          justify-content: space-between;
      }
  
      .price_summary_item p {
          display: table-cell;
          text-align: right;
          letter-spacing: 0.25px;
          width: 50%;
      }
  
      .price_summary_item:last-child {
          font-style: normal;
          font-weight: 500;
          font-size: 24px;
          letter-spacing: 0.25px;
          width: 100%;
          margin-top: 25px;
          padding-top: 35px;
          border-top: 2px solid lightgray;
      }
  
      .price_summary_item:last-child p:first-child {
          text-align: left;
      }
  
      #order_summary {
          width: 405px;
      }
  
      .order_summary_item {
          display: flex;
          justify-content: space-between;
      }
  
      .billing_address p {
          padding-left: 140px;
      }        
  
      .billing_address p:first-child {
          padding: 0;
          display: inline-flex;
      }
  
      .billing_address p:nth-child(2) {
          padding-left: 10px;
          display: inline-flex;
      }
  
      #shipping_address,
      #billing_address {
          width: 50%;
          float: left;
          color: rgba(0, 0, 0, 0.6);
      }
      #shipping_address h3 {
          color: #41dede;
          -webkit-print-color-adjust: exact;
      }
  
      .border_line {
          border-top: 5px solid lightgray; 
          margin: 10px 0;
      }
  
      .border_line:first {
          border-color: gray
      }
  
      #header {
          padding: 10px 0; 
          display: flex;
          justify-content: space-between;
          overflow: hidden;
          margin: 0 0 10px;
      }
  
      #payment_info div {
          display: flex;
          justify-content: space-between;
      }
      </style>
  </head>
  
  <body>
      <div class="flex-container">
          <div id="header">
              <div style="display: table-cell; vertical-align: top; padding-right: 25px;">
                  <img id="logo" src="https://shoclef-android-apk.s3.amazonaws.com/Square%403x.png">
              </div>
              <div style="float: right;">
                  <h2 id="invoice_log"><b>Packing Slip</b></h2>
                  <div id="order_summary">
                      <div class="order_summary_item">
                          <p>Order Date:</p>
                          <p>Oct 4, 2020</p>
                      </div>
                      <div class="order_summary_item">
                          <p>Order #:</p>
                          <p>01e82a91-0d85-4e68-9f81-97b287bb46ae</p>
                      </div>
                      <div class="order_summary_item">
                          <p>Product Qty:</p>
                          <p>2 items</p>
                      </div>
                  </div>
              </div>
          </div>
          <div class="border_line"></div>
          <div style="display: flex;">
              <div id="shipping_address">
                  <h2>Shipping To: </h2>
                  <div>
                      <p><b>Crystal Ding</b></p>
                      <p>116 Santa Monica Boulevard</p>
                      <p>Santa Monica</p>
                      <p>California</p>
                      <p>United States</p>
                      <p>+15107178878</p>
                      <p>test.crystal@shoclef.com</p>
                  </div>
              </div>
              <div id="billing_address">
                  <h2>Shipping From:</h2>
                  <div>
                      <p><b>Crystal Ding</b></p>
                      <p>116 Santa Monica Boulevard</p>
                      <p>Santa Monica</p>
                      <p>California</p>
                      <p>United States</p>
                      <p>+15107178878</p>
                      <p>test.crystal@shoclef.com</p>
                  </div>
              </div>
          </div>
          
          <div class="border_line"></div>
          <div id="payment_info">
              <h2>Sale Order</h2>
              <div>
                  <p><b>Sale Order #: </b></p>
                  <p>834njfv-e09j3-2kjriu78sfdvk-skdrfl04</p>
              </div>
          </div>
          <div style="margin-bottom: 40px;">
              <table id="items_table">
                  <thead>
                      <tr>
                          <th>Item Discription</th>
                          <th>SKU/ProductID</th>
                          <th>QTY</th>
                          <th>Price</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr class="empty_row">
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                      </tr>
                      <tr>
                          <td>
                              <div class="product_name">
                                  <p class="line_break"><b>Product Name 1 if too long just use second line and past that just use the third line blah blah blah blah balh blasdfhsrf</b></p>
                                  <p>Special Note: N/A</p>
                                  <p>Estimate Delivery : <span class="delivery_estimate">Tuesday, Oct 6, 2020 by 9:00 pm</span></p>
                                  
                              </div>
                          </td>
                          <td>
                              <p>SKU: 187823849</p>
                              <p>823br-bjjfwif8s-76317-88349</p>
                          </td>
                          <td>1</td>
                          <td>$100</td>
                      </tr>
                      <tr>
                          <td>
                              <div class="product_name">
                                  <p class="line_break"><b>Product Name 1 if too long just use second line and past that just use the third line blah blah blah blah balh blasdfhsrf</b></p>
                                  <p>Special Note: N/A</p>
                                  <p>Estimate Delivery : <span class="delivery_estimate">Tuesday, Oct 6, 2020 by 9:00 pm</span></p>
                                  
                              </div>
                          </td>
                          <td>
                              <p>SKU: 187823849</p>
                              <p>823br-bjjfwif8s-76317-88349</p>
                          </td>
                          <td>1</td>
                          <td>$100</td>
                      </tr>
                      <tr>
                          <td>
                              <div class="product_name">
                                  <p class="line_break"><b>Product Name 1 if too long just use second line and past that just use the third line blah blah blah blah balh blasdfhsrf</b></p>
                                  <p>Special Note: N/A</p>
                                  <p>Estimate Delivery : <span class="delivery_estimate">Tuesday, Oct 6, 2020 by 9:00 pm</span></p>
                                  
                              </div>
                          </td>
                          <td>
                              <p>SKU: 187823849</p>
                              <p>823br-bjjfwif8s-76317-88349</p>
                          </td>
                          <td>1</td>
                          <td>$100</td>
                      </tr>
                      <tr>
                          <td>
                              <div class="product_name">
                                  <p class="line_break"><b>Product Name 1 if too long just use second line and past that just use the third line blah blah blah blah balh blasdfhsrf</b></p>
                                  <p>Special Note: N/A</p>
                                  <p>Estimate Delivery : <span class="delivery_estimate">Tuesday, Oct 6, 2020 by 9:00 pm</span></p>
                                  
                              </div>
                          </td>
                          <td>
                              <p>SKU: 187823849</p>
                              <p>823br-bjjfwif8s-76317-88349</p>
                          </td>
                          <td>1</td>
                          <td>$100</td>
                      </tr>
                  </tbody>
              </table>
          </div>
          
          <div id="price_summary">
              <div class="price_summary_item">
                  <p>Subtotal: </p>
                  <p>$100.83</p>
              </div>
              <div class="price_summary_item">
                  <p>Tax/VAT: </p>
                  <p>$20.93</p>
              </div>
              <div class="price_summary_item">
                  <p>Shipping: </p>
                  <p>$10.83</p>
              </div>
              <div class="price_summary_item">
                  <p><b>Order Total:</b></p>
                  <p><b>USD </b>$100.83</p>
              </div>
          </div>
      </div>
      
  </body></html>`;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(pdfTemplate);
  const invoicePDF = await page.pdf({
    // path: 'invoice.pdf',
    format: 'A4',
    margin: {
      top: '2cm',
      bottom: '2cm',
      left: '1.5cm',
      right: '1.5cm',
    },
  });

  await browser.close();

  return invoicePDF;
};
