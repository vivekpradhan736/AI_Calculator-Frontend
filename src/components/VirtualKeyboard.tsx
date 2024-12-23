import { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import Draggable from 'react-draggable';

interface GeneratedResult {
    expression: string;
    answer: string;
}

interface Response {
    expr: string;
    result: string;
    assign: boolean;
}

const VirtualKeyboard = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [typedExpression, setTypedExpression] = useState('');
    const [color] = useState('rgb(255, 255, 255)');
    const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
    const [dictOfVars, setDictOfVars] = useState({});
    const [result, setResult] = useState<GeneratedResult>();
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                ctx.font = '20px Arial';
                ctx.fillStyle = color;
            }
        }
    }, []);

    const renderToCanvas = (text: string) => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
                ctx.fillText(text, 50, 50); // Render typed expression
            }
        }
    };

    const handleKeyPress = (key: string) => {
        setTypedExpression((prev) => {
            const updatedExpression = prev + key;
            console.log("prev",updatedExpression)
            renderToCanvas(updatedExpression);
            return updatedExpression;
        });
    };

    const calculateExpression = async () => {
        try {
            // Use eval or send to backend for computation
            const result = eval(typedExpression);
            renderToCanvas(`${typedExpression} = ${result}`);
            setTypedExpression(`${result}`);
        } catch (err) {
            console.log("err",err)
            renderToCanvas('Error in expression');
        }
    };

    const clearExpression = () => {
        setTypedExpression('');
        renderToCanvas('');
    };

    useEffect(() => {
        if (result) {
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result]);

    const renderLatexToCanvas = (expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        setLatexExpression([...latexExpression, latex]);

        // Clear the main canvas
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const runRoute = async () => {
        const canvas = canvasRef.current;
        console.log("canvas",canvas?.toDataURL('image/png'))
        const data = {
            image: canvas?.toDataURL('image/png'),
            dict_of_vars: dictOfVars
        }
        console.log("data",data)
    
        if (canvas) {
            const response = await axios({
                method: 'post',
                url: `${import.meta.env.VITE_API_URL}/calculate`,
                data: {
                    image: canvas.toDataURL('image/png'),
                    dict_of_vars: dictOfVars
                }
            });

            const resp = await response.data;
            console.log('Response', resp);
            resp.data.forEach((data: Response) => {
                if (data.assign === true) {
                    // dict_of_vars[resp.result] = resp.answer;
                    setDictOfVars({
                        ...dictOfVars,
                        [data.expr]: data.result
                    });
                }
            });
            const ctx = canvas.getContext('2d');
            const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
            let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const i = (y * canvas.width + x) * 4;
                    if (imageData.data[i + 3] > 0) {  // If pixel is not transparent
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }

            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            setLatexPosition({ x: centerX, y: centerY });
            resp.data.forEach((data: Response) => {
                setTimeout(() => {
                    setResult({
                        expression: data.expr,
                        answer: data.result
                    });
                }, 1000);
            });
        }
    };

    const KEYS = [
        ['7', '8', '9', '+', '-'],
        ['4', '5', '6', '*', '/'],
        ['1', '2', '3', '%', '^'],
        ['0', '.', '=', '(', ')'],
        ['A', 'B', 'C', 'D', 'E'],
        ['F', 'G', 'H', 'I', 'J'],
        ['Clear', 'Space', 'Del']
    ];

    return (
        <>
            <div className="grid grid-cols-3 gap-2 p-2 bg-gray-800">
                {KEYS.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-2">
                        {row.map((key) => (
                            <Button
                                key={key}
                                onClick={() =>
                                    key === 'Clear'
                                    ? clearExpression()
                                    : key === 'Del'
                                    ? setTypedExpression((prev) =>prev.slice(0, -1))
                                    : key === 'Space'
                                    ? handleKeyPress(' ')
                                    : key === '='
                                    ? calculateExpression()
                                    : handleKeyPress(key)
                                }
                                className="bg-black text-white p-2"
                            >
                                {key}
                            </Button>
                        ))}
                    </div>
                ))}
            </div>
            <Button
                    onClick={runRoute}
                    className='z-20 bg-black text-white'
                    variant='default'
                    color='white'
                >
                    Run
                </Button>
            <canvas ref={canvasRef} className="w-full h-full bg-gray-900"></canvas>
            {latexExpression && latexExpression.map((latex, index) => (
                            <Draggable
                                key={index}
                                defaultPosition={latexPosition}
                                onStop={(e, data) => setLatexPosition({ x: data.x, y: data.y })}
                            >
                                <div className="absolute p-2 text-white rounded shadow-md">
                                    <div className="latex-content">{latex}</div>
                                </div>
                            </Draggable>
                        ))}
        </>
    );
};

export default VirtualKeyboard;