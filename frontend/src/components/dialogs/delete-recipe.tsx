import { Api } from "@/api/api";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

/**
 * The properties for {@link DeleteRecipeDialog}
 */
export type DeleteRecipeDialogProps = {
    /** Recipe uuid */
    recipe_uuid: string;
    /** Callback function in case of closing dialog */
    onClose: () => void;
};

/**
 * Dialog to delete a recipe
 */
export function DeleteRecipeDialog(props: DeleteRecipeDialogProps) {
    const [t] = useTranslation("recipe");
    const [tg] = useTranslation();

    const deleteTag = async () => {
        toast.promise(Api.recipe.delete(props.recipe_uuid), {
            loading: tg("toast.loading"),
            success: (result) => {
                if (result.error) {
                    toast.error(result.error.message);
                    return;
                }

                props.onClose();
                return t("toast.deleted-success");
            },
            error: tg("toast.general-error"),
        });
    };

    return (
        <Dialog open={true} onOpenChange={props.onClose}>
            <DialogContent size={"sm"}>
                <DialogHeader className="items-start">
                    <DialogTitle>{t("dialog.delete-title")} </DialogTitle>
                    <DialogDescription className="flex w-full flex-col items-start gap-2">
                        {t("dialog.delete-description")}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <div className="flex w-full justify-between">
                        <Button variant="secondary" onClick={() => props.onClose()}>
                            {tg("button.close")}
                        </Button>
                        <Button variant="destructive" onClick={async () => await deleteTag()}>
                            {t("button.delete")}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
