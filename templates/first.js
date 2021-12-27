module.exports = () => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <style>
            *{margin: 0px; padding: 0px;}
            canvas{border: 1px solid black;}
        </style>
    </head>
    <body>
        <canvas></canvas>
        <script>
            let canvas = document.querySelector('canvas');
            canvas.width = 1000;
            canvas.height = 500;

            let ctx = canvas.getContext('2d');
        </script>
    </body>
    </html>
    `
}