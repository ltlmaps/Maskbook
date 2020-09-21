import React, { useState, useEffect, useMemo } from 'react'
import {
    Button,
    makeStyles,
    Theme,
    createStyles,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
} from '@material-ui/core'
import type { Trade } from '@uniswap/sdk'
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward'
import { useStylesExtends } from '../../../../components/custom-ui-helper'
import { useI18N } from '../../../../utils/i18n-next-ui'
import ShadowRootDialog from '../../../../utils/shadow-root/ShadowRootDialog'
import { TradeSummary, TradeSummaryProps } from './TradeSummary'
import type { Token } from '../../../../web3/types'
import { getActivatedUI } from '../../../../social-network/ui'
import {
    useTwitterDialog,
    useTwitterButton,
    useTwitterCloseButton,
} from '../../../../social-network-provider/twitter.com/utils/theme'
import { DialogDismissIconUI } from '../../../../components/InjectedComponents/DialogDismissIcon'
import { TokenPanel } from './TokenPanel'
import { useComputedTrade } from '../../uniswap/useComputedTrade'
import BigNumber from 'bignumber.js'
import { PriceStaleWarnning } from './PriceStaleWarnning'

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        paper: {
            width: '370px !important',
        },
        reverseIcon: {
            width: 16,
            height: 16,
            marginLeft: 5,
        },
        tip: {
            fontSize: 11,
            margin: theme.spacing(1, 0, 2),
        },
        summary: {
            marginTop: theme.spacing(1),
            marginBottom: 0,
        },
        button: {
            paddingTop: 12,
            paddingBottom: 12,
        },
    }),
)

export interface ConfirmDialogUIProps
    extends withClasses<
        | KeysInferFromUseStyles<typeof useStyles>
        | 'root'
        | 'dialog'
        | 'backdrop'
        | 'container'
        | 'paper'
        | 'header'
        | 'title'
        | 'content'
        | 'actions'
        | 'close'
        | 'button'
    > {
    trade: Trade | null
    inputToken?: Token
    outputToken?: Token
    open: boolean
    onConfirm: () => void
    onClose?: () => void
    UniswapTradeSummaryProps?: Partial<TradeSummaryProps>
}

export function ConfirmDialogUI(props: ConfirmDialogUIProps) {
    const { t } = useI18N()

    const classes = useStylesExtends(useStyles(), props)
    const { trade, inputToken, outputToken, open, onConfirm, onClose, UniswapTradeSummaryProps } = props

    //#region snapshot
    const computedTrade = useComputedTrade(trade)
    const [staled, setStaled] = useState(false)
    const [retakeFlag, updateRetakeFlag] = useState(false)
    const snapshot = useMemo(
        () => ({
            inputAmount: trade?.inputAmount.raw.toString() ?? '0',
            outputAmount: trade?.outputAmount.raw.toString() ?? '0',
            maximumSold: computedTrade?.maximumSold.toSignificant(9) ?? '0',
            minimumReceived: computedTrade?.minimumReceived.toSignificant(9) ?? '0',
        }),
        [retakeFlag],
    )
    useEffect(() => {
        updateRetakeFlag((x) => !x)
        setStaled(false)
    }, [open])
    useEffect(() => {
        if (Object.values(snapshot).some((x) => x === '0')) updateRetakeFlag((x) => !x)
        else setStaled(true)
    }, [
        trade?.inputAmount.raw.toString() ?? '0',
        trade?.outputAmount.raw.toString() ?? '0',
        computedTrade?.maximumSold.toSignificant(9) ?? '0',
        computedTrade?.minimumReceived.toSignificant(9) ?? '0',
    ])
    //#endregion

    return (
        <div className={classes.root}>
            <ShadowRootDialog
                className={classes.dialog}
                classes={{
                    container: classes.container,
                    paper: classes.paper,
                }}
                open={open}
                scroll="body"
                fullWidth
                maxWidth="sm"
                disableAutoFocus
                disableEnforceFocus
                onEscapeKeyDown={onClose}
                onExit={onClose}
                BackdropProps={{
                    className: classes.backdrop,
                }}>
                <DialogTitle className={classes.header}>
                    <IconButton classes={{ root: classes.close }} onClick={onClose}>
                        <DialogDismissIconUI />
                    </IconButton>
                    <Typography className={classes.title} display="inline" variant="inherit">
                        Confirm Swap
                    </Typography>
                </DialogTitle>
                <DialogContent className={classes.content}>
                    {inputToken && outputToken ? (
                        <>
                            <TokenPanel amount={snapshot.inputAmount} token={inputToken} />
                            <ArrowDownwardIcon className={classes.reverseIcon} />
                            <TokenPanel amount={snapshot.outputAmount} token={outputToken} />
                        </>
                    ) : null}
                    {staled ? (
                        <PriceStaleWarnning
                            onAccept={() => {
                                updateRetakeFlag((x) => !x)
                                setStaled(false)
                            }}
                        />
                    ) : null}
                    <Typography
                        className={classes.tip}
                        color="textSecondary">{`Output is estimated. You will receive at least ${snapshot.minimumReceived} ${trade?.outputAmount.currency.symbol} or the transaction will revert.`}</Typography>
                    <TradeSummary
                        classes={{ root: classes.summary }}
                        trade={trade}
                        inputToken={inputToken}
                        outputToken={outputToken}
                        {...UniswapTradeSummaryProps}
                    />
                </DialogContent>
                <DialogActions className={classes.actions}>
                    <Button
                        className={classes.button}
                        color="primary"
                        size="large"
                        variant="contained"
                        fullWidth
                        disabled={staled}
                        onClick={onConfirm}>
                        Confirm Swap
                    </Button>
                </DialogActions>
            </ShadowRootDialog>
        </div>
    )
}

export interface ConfirmDialogProps extends ConfirmDialogUIProps {}

export function ConfirmDialog(props: ConfirmDialogProps) {
    const ui = getActivatedUI()
    const twitterClasses = {
        ...useTwitterDialog(),
        ...useTwitterButton(),
        ...useTwitterCloseButton(),
    }

    return ui.internalName === 'twitter' ? (
        <ConfirmDialogUI classes={twitterClasses} {...props} />
    ) : (
        <ConfirmDialogUI {...props} />
    )
}