import { Accessor, createComputed } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { createSignal } from "solid-js/types/server/reactive.js";

interface PopupProps {
    children?: JSX.Element
    onClosed?: () => void
    show?: Accessor<boolean>
    styleOverwrite: JSX.DOMAttributes<HTMLDivElement>['style']
}

export default function Popup(props: PopupProps) {
    const [show, setShow] = createSignal(props.show ? props.show() : false)

    createComputed(() => {
        if (!props.show) return;
        setShow(props.show())
    })

    if (!show()) {
        return (<></>)
    }

    return (<div class="Popup" style={props.styleOverwrite}>
    {props.children}
    </div>)
}