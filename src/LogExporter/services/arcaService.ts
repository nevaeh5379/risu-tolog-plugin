export const generateArcaContent = async (nodes: HTMLElement[], title: string, content: string) => {
    let imageList = '';
    let imageCounter = 0;
    for (const node of nodes) {
        const images = Array.from(node.querySelectorAll('img'));
        for (let i = 0; i < images.length; i++) {
            imageCounter++;
            imageList += `[img]${imageCounter}.jpg[/img]\n`;
        }
    }

    return `[title]${title}[/title][content]${content}\n\n${imageList}[/content]`;
};
