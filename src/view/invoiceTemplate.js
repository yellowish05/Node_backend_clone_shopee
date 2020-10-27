module.exports = (orderDetails) => {
    let payment_method = ''
    if(orderDetails.payment_info.payment_method.type == 'card')
        payment_method = `${orderDetails.payment_info.payment_method.details.brand} Card ending in  ${orderDetails.payment_info.payment_method.details.last4}`
    else
        payment_method = orderDetails.payment_info.payment_method.type

    const billing_address = orderDetails.payment_info.billing_address

    const pdfTemplate = `<!DOCTYPE html>
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
            /* display: flex; */
            /* flex-direction: column; */
        }
    
        h1 {
            font-size: 3em;
            margin: 0;
        }
    
        h2 {
            font-size: 26px;
            margin-top: 10px;
        }
    
        p {
            margin: 0 0 7px;
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
        }
    
        th {
            background-color: #41dede;
            color: white;
            text-transform: uppercase;
            padding: 10px 10px;
            -webkit-print-color-adjust: exact;
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
            width: 100%;
            padding: 10px 20px;
            text-align: left;
        }
    
        table tbody tr td:first-child {
            display: table;
            width: 100%;
            text-align: left;
        }
        
        td:empty::after {
            content: "";
        }
    
        span {
            margin-left: 40%;
        }
    
        #logo {
            width: 150px;
        }
    
        #invoice_log {
            padding: 4px 20px;
            background-color: #41dede;
            color: white;
            text-align: center;
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
        }
    
        .product_name {
            display: table-cell;
            padding-left: 120px;
            width: 100%;
            vertical-align: middle;
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
            width: 40%;
            float: right;
        }
    
        .price_summary_item {
            width: 100%;
            display: table;
            justify-content: space-between;
        }
    
        .price_summary_item p {
            display: table-cell;
        }
    
        .price_summary_item p:nth-child(2) {
            text-align: right;
        }
    
        .price_summary_item:last-child {
            font-size: 20px;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid lightgray;
        }
    
        .price_summary_item:last-child p:last-child {
            color: red;
        }
    
        #order_summary {
            width: 405px;
        }
    
        .order_summary_item {
            display: inline-flex;
        }
    
        .order_summary_item p:first-child {
            width: 100px;
            font-weight: bold;
        }
        
        .order_summary_item p:last-child {
            width: 305px;
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
    
        #shipping_address h3 {
            color: #41dede;
            -webkit-print-color-adjust: exact;
        }
    
        .delivery_estimate {
            color: green
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
        </style>
    </head>
    
    <body>
        <div class="flex-container">
            <div id="header">
                <div style="display: table-cell; vertical-align: top; padding-right: 25px;">
                    <img id="logo" src="https://cerebral-overload.com/wp-content/uploads/2018/09/1-7-1.jpg">
                </div>
                <div style="float: right;">
                    <h2 id="invoice_log"><b>INVOICE</b></h2>
                    <div id="order_summary">
                        <div class="order_summary_item">
                            <p>Order Date:</p>
                            <p>${orderDetails.orderDate}</p>
                        </div>
                        <div class="order_summary_item">
                            <p>Order #:</p>
                            <p>${orderDetails.orderID}</p>
                        </div>
                        <div class="order_summary_item">
                            <p>Order Total:</p>
                            <p>${orderDetails.price_summary.total} (${orderDetails.items.length} item)</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="border_line"></div>
            <div id="shipping_address">
                <h2>Shipping Address</h2>
                <div>
                    <p><b>${orderDetails.shipping_address.client_name}</b></p>
                    <p>${orderDetails.shipping_address.street}</p>
                    <p>${orderDetails.shipping_address.city}</p>
                    <p>${orderDetails.shipping_address.state}</p>
                    <p>${orderDetails.shipping_address.country}</p>
                </div>
            </div>
            <div class="border_line"></div>
            <div id="payment_info">
                <h2>Payment Information</h2>
                <div>
                    <div>
                        <p><b>Payment Method: </b>M${payment_method}</p>
                    </div>
                    <div class="billing_address">
                        <p><b>Billing Address:</b></p>
                        <p>${billing_address.line1}</p>
                        <p>${billing_address.city}</p>
                        <p>${billing_address.state}</p>
                        <p>${billing_address.country}</p>
                    </div>
                </div>
            </div>
            <div class="border_line"></div>
            <div style="margin-bottom: 40px;">
                <h2>Shipping Details</h2>
                <table id="items_table">
                    <thead>
                        <tr>
                            <th>Item Discription</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
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
                                <img class="product_image" src="http://ae01.alicdn.com/kf/H604f784ffa6846009d12cd66ac1d92eeb.jpg">
                                <div class="product_name">
                                    <p class="line_break"><b>Product Name 12345678913245ads321fa3d2s1f32ads1f32as1f32a3d1f3a1d3f2a1ds32f1a3s2d1f3a2sd1f3a21sdf32ad1s3f21a3sd2f1a3s2f1a3sd2f1a3sd2f1asd3f213216789123456789123465498423156ds5fasd132f1a65sf1a3d2s1fad3sf165adf32a1sf3a5ewf3a2ds1fda3s2f15ew132d15a312</b></p>
                                    <p>Delivery Estimate</p>
                                    <p class="delivery_estimate">Tuesday, Oct 6, 2020 by 9:00 pm</p>
                                    <p>Sold by: Give Me</p>
                                </div>
                            </td>
                            <td>$100</td>
                            <td>1</td>
                            <td>$100</td>
                        </tr>
                        <tr>
                            <td>
                                <img class="product_image" src="http://ae01.alicdn.com/kf/H604f784ffa6846009d12cd66ac1d92eeb.jpg">
                                <div class="product_name">
                                    <p class="line_break"><b>Product Name 123456789132456789123456789123465498423156ds5fasd132f1a65sf1a3d2s1fad3sf165adf32a1sf3a5ewf3a2ds1fda3s2f15ew132d15a312</b></p>
                                    <p>Delivery Estimate</p>
                                    <p class="delivery_estimate">Tuesday, Oct 6, 2020 by 9:00 pm</p>
                                    <p>Sold by: Give Me</p>
                                </div>
                            </td>
                            <td>$100</td>
                            <td>1</td>
                            <td>$100</td>
                        </tr>
                        <tr>
                            <td>
                                <img class="product_image" src="http://ae01.alicdn.com/kf/H604f784ffa6846009d12cd66ac1d92eeb.jpg">
                                <div class="product_name">
                                    <p class="line_break"><b>Product Name 123456789132456789123456789123465498423156ds5fasd132f1a65sf1a3d2s1fad3sf165adf32a1sf3a5ewf3a2ds1fda3s2f15ew132d15a312</b></p>
                                    <p>Delivery Estimate</p>
                                    <p class="delivery_estimate">Tuesday, Oct 6, 2020 by 9:00 pm</p>
                                    <p>Sold by: Give Me</p>
                                </div>
                            </td>
                            <td>$100</td>
                            <td>1</td>
                            <td>$100</td>
                        </tr>
                        <tr>
                            <td>
                                <img class="product_image" src="http://ae01.alicdn.com/kf/H604f784ffa6846009d12cd66ac1d92eeb.jpg">
                                <div class="product_name">
                                    <p class="line_break"><b>Product Name 123456789132456789123456789123465498423156ds5fasd132f1a65sf1a3d2s1fad3sf165adf32a1sf3a5ewf3a2ds1fda3s2f15ew132d15a312</b></p>
                                    <p>Delivery Estimate</p>
                                    <p class="delivery_estimate">Tuesday, Oct 6, 2020 by 9:00 pm</p>
                                    <p>Sold by: Give Me</p>
                                </div>
                            </td>
                            <td>$100</td>
                            <td>1</td>
                            <td>$100</td>
                        </tr>
                        <tr>
                            <td>
                                <img class="product_image" src="http://ae01.alicdn.com/kf/H604f784ffa6846009d12cd66ac1d92eeb.jpg">
                                <div class="product_name">
                                    <p class="line_break"><b>Product Name 123456789132456789123456789123465498423156ds5fasd132f1a65sf1a3d2s1fad3sf165adf32a1sf3a5ewf3a2ds1fda3s2f15ew132d15a312</b></p>
                                    <p>Delivery Estimate</p>
                                    <p class="delivery_estimate">Tuesday, Oct 6, 2020 by 9:00 pm</p>
                                    <p>Sold by: Give Me</p>
                                </div>
                            </td>
                            <td>$100</td>
                            <td>1</td>
                            <td>$100</td>
                        </tr>
                        <tr>
                            <td>
                                <img class="product_image" src="http://ae01.alicdn.com/kf/H604f784ffa6846009d12cd66ac1d92eeb.jpg">
                                <div class="product_name">
                                    <p class="line_break"><b>Product Name 12345678913245ads321fa3d2s1f32ads1f32as1f32a3d1f3a1d3f2a1ds32f1a3s2d1f3a2sd1f3a21sdf32ad1s3f21a3sd2f1a3s2f1a3sd2f1a3sd2f1asd3f213216789123456789123465498423156ds5fasd132f1a65sf1a3d2s1fad3sf165adf32a1sf3a5ewf3a2ds1fda3s2f15ew132d15a312</b></p>
                                    <p>Delivery Estimate</p>
                                    <p class="delivery_estimate">Tuesday, Oct 6, 2020 by 9:00 pm</p>
                                    <p>Sold by: Give Me</p>
                                </div>
                            </td>
                            <td>$100</td>
                            <td>1</td>
                            <td>$100</td>
                        </tr>
                        <tr>
                            <td>
                                <img class="product_image" src="http://ae01.alicdn.com/kf/H604f784ffa6846009d12cd66ac1d92eeb.jpg">
                                <div class="product_name">
                                    <p class="line_break"><b>Product Name 123456789132456789123456789123465498423156ds5fasd132f1a65sf1a3d2s1fad3sf165adf32a1sf3a5ewf3a2ds1fda3s2f15ew132d15a312</b></p>
                                    <p>Delivery Estimate</p>
                                    <p class="delivery_estimate">Tuesday, Oct 6, 2020 by 9:00 pm</p>
                                    <p>Sold by: Give Me</p>
                                </div>
                            </td>
                            <td>$100</td>
                            <td>1</td>
                            <td>$100</td>
                        </tr>
                        <tr>
                            <td>
                                <img class="product_image" src="http://ae01.alicdn.com/kf/H604f784ffa6846009d12cd66ac1d92eeb.jpg">
                                <div class="product_name">
                                    <p class="line_break"><b>Product Name 123456789132456789123456789123465498423156ds5fasd132f1a65sf1a3d2s1fad3sf165adf32a1sf3a5ewf3a2ds1fda3s2f15ew132d15a312</b></p>
                                    <p>Delivery Estimate</p>
                                    <p class="delivery_estimate">Tuesday, Oct 6, 2020 by 9:00 pm</p>
                                    <p>Sold by: Give Me</p>
                                </div>
                            </td>
                            <td>$100</td>
                            <td>1</td>
                            <td>$100</td>
                        </tr>
                        <tr>
                            <td>
                                <img class="product_image" src="http://ae01.alicdn.com/kf/H604f784ffa6846009d12cd66ac1d92eeb.jpg">
                                <div class="product_name">
                                    <p class="line_break"><b>Product Name 123456789132456789123456789123465498423156ds5fasd132f1a65sf1a3d2s1fad3sf165adf32a1sf3a5ewf3a2ds1fda3s2f15ew132d15a312</b></p>
                                    <p>Delivery Estimate</p>
                                    <p class="delivery_estimate">Tuesday, Oct 6, 2020 by 9:00 pm</p>
                                    <p>Sold by: Give Me</p>
                                </div>
                            </td>
                            <td>$100</td>
                            <td>1</td>
                            <td>$100</td>
                        </tr>
                        <tr>
                            <td>
                                <img class="product_image" src="http://ae01.alicdn.com/kf/H604f784ffa6846009d12cd66ac1d92eeb.jpg">
                                <div class="product_name">
                                    <p class="line_break"><b>Product Name 123456789132456789123456789123465498423156ds5fasd132f1a65sf1a3d2s1fad3sf165adf32a1sf3a5ewf3a2ds1fda3s2f15ew132d15a312</b></p>
                                    <p>Delivery Estimate</p>
                                    <p class="delivery_estimate">Tuesday, Oct 6, 2020 by 9:00 pm</p>
                                    <p>Sold by: Give Me</p>
                                </div>
                            </td>
                            <td>$100</td>
                            <td>1</td>
                            <td>$100</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div id="price_summary">
                <div class="price_summary_item">
                    <p>Items: </p>
                    <p>$109.09</p>
                </div>
                <div class="price_summary_item">
                    <p>Shipping & Handling: </p>
                    <p>$0.00</p>
                </div>
                <div class="price_summary_item">
                    <p>Total Before Tax: </p>
                    <p>$109.09</p>
                </div>
                <div class="price_summary_item">
                    <p>Estimated Tax Collected: </p>
                    <p>$10.45</p>
                </div>
                <div class="price_summary_item">
                    <p><b>Order Total</b></p>
                    <p><b>$120.44</b></p>
                </div>
            </div>
        </div>
        
    </body></html>`
};
