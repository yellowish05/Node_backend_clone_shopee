module.exports = (body, args) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Email</title>
    <style>
        body {
            font-family: sans-serif;
            background: #E5E5E5;
            padding: 20px;
        }

        table {
            border-collapse: collapse;
            width: 100%;
        }

        table tr td {
            padding: 20px 30px;
        }

        .pre-header {
            text-align: center;
        }

        .pre-header td {
            padding-top: 5px;
        }

        .pre-header td img {
            max-width: 75px;
        }

        .header {
            background: #01CFE2;
            text-align: center;
            color: #fff;
        }

        .header h1 {
            font-style: normal;
            font-weight: 300;
            font-size: 58px;
            margin: 0;
        }

        .header p {
            font-style: normal;
            font-weight: normal;
            font-size: 16px;
        }

        .body {
            background: #fff;
        }

        .sign-up h5 {
            font-style: normal;
            font-weight: 500;
            font-size: 26px;
            margin: 0;
        }

        .sign-up h5 + p {
            font-style: normal;
            font-weight: 300;
            font-size: 26px;
            margin: 0 0 30px 0;
            text-transform: uppercase;
            color: rgba(0, 0, 0, 0.6);
        }

        .footer {
            background: #01CFE2;
            text-align: center;
            color: #fff;
        }

        .footer p {
            font-size: 14px;
            text-transform: uppercase;
            font-weight: 500;
        }

        .footer .rights {
            font-size: 12px;
            font-weight: 300;
            color: rgba(255, 255, 255, 0.73);
            text-transform: none;
        }

        .footer .rights a {
            text-decoration: none;
            color: rgba(255, 255, 255, 0.73);
        }

        .footer .socials a {
            display: inline-block;
            margin: 0 4px;
        }

        .footer .socials a img { 
            max-width: 30px;
        }
    </style>
</head>
<body>
    <table>
        <tbody>
            ${body}
        </tbody>
    </table>
</body>
</html>
`;
