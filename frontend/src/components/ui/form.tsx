import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * The properties for {@link Form}
 */
export type FormProps = {
    /** Class names */
    className?: string;

    /** The action that should run when pressing submitting the form */
    onSubmit: () => void;

    /** The child elements of the form */
    children?: React.ReactNode | Array<React.ReactNode>;
};

/**
 * A simple form to make declaring easier
 */
function Form(props: FormProps) {
    return (
        <form
            {...props}
            method={"post"}
            onSubmit={(e) => {
                e.preventDefault();
                props.onSubmit();
            }}
            className={cn(props.className, "w-full space-y-8 lg:max-w-lg")}
        >
            {props.children}
        </form>
    );
}

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                className,
            )}
            {...props}
        />
    );
}

function FormLabel({ htmlFor, className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
    return (
        <Label
            data-slot="form-label"
            className={cn("data-[error=true]:text-destructive-foreground mb-2", className)}
            htmlFor={htmlFor}
            {...props}
        />
    );
}

export { Form, FormLabel, Input };
