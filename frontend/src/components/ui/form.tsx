import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

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

export { FormLabel };
