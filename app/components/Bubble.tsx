// app/components/Bubble.tsx
const Bubble = ({ message }) => {
    const { content, role } = message;
    // Corrected console.log statement
    console.log(`Bubble rendering: role=${role}, content length=${content?.length}, content="${content}"`);

    return (
        <div className={`${role} bubble`}>{content}</div>
    );
};
export default Bubble;