document.addEventListener('contextmenu', event => {
    event.preventDefault();
});
document.addEventListener('mousedown', dragging => {
    dragging.preventDefault();
});