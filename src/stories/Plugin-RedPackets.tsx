import React from 'react'
import { storiesOf } from '@storybook/react'
import { RedPacketInList } from '../plugins/RedPacket/UI/RedPacket'
import { RedPacketRecord, RedPacketStatus, RedPacketJSONPayload } from '../plugins/RedPacket/types'
import { number, text, select } from '@storybook/addon-knobs'
import { Typography, Paper } from '@material-ui/core'
import { makeTypedMessageText } from '../protocols/typed-message'
import { DecryptPostSuccess } from '../components/InjectedComponents/DecryptedPost/DecryptedPostSuccess'
import { RedPacketMetaKey } from '../plugins/RedPacket/constants'
import { EthereumTokenType } from '../web3/types'

storiesOf('Plugin: Red Packets', module)
    .add('RedPacket', () => {
        const { decimals, erc20name, erc20symbol, total, ...opts } = createRedPacketKnobs()
        return (
            <>
                <Typography>ETH</Typography>
                <RedPacketInList
                    redPacket={createRecord({
                        ...opts,
                        total: total * 1000000000000000000,
                        type: EthereumTokenType.Ether,
                    })}
                />
                <hr />
                <Typography>ERC20</Typography>
                <RedPacketInList
                    redPacket={createRecord({
                        ...opts,
                        type: EthereumTokenType.ERC20,
                        total: total * 10 ** decimals,
                        token: {
                            address: 'addr',
                            name: erc20name,
                            decimals,
                            symbol: erc20symbol,
                        },
                    })}
                />
            </>
        )
    })
    .add('Decrypted post with Red Packet', () => {
        const knobs = createRedPacketKnobs()
        // @ts-ignore
        const payload: RedPacketJSONPayload = {
            ...createRecord({ ...knobs, type: EthereumTokenType.Ether }),
            rpid: 'rpid',
            sender: { address: 'address', message: knobs.message, name: knobs.senderName },
            total: (knobs.total * 10 ** 18).toString(),
            creation_time: Date.now(),
        }
        const meta = new Map<string, unknown>([[RedPacketMetaKey, payload]])
        return (
            <Paper style={{ maxWidth: 400 }}>
                <div>
                    <DecryptPostSuccess
                        alreadySelectedPreviously={[]}
                        data={{
                            content: makeTypedMessageText('decrypted message!', meta),
                        }}
                        profiles={[]}
                    />
                </div>
            </Paper>
        )
    })
function createRedPacketKnobs() {
    const senderName = text('Sender name', 'Friendly neighborhood')

    const total = number('Total ETH', 5, { min: 0 })
    const shares = number('Shares', 1, { step: 1, min: 0 })
    const claimedAmount = number('Claimed ETH', 1, { min: 0 }) * 1000000000000000000

    const message = text('Message', 'Happy New Year')
    const status = select('Status', RedPacketStatus, RedPacketStatus.empty)

    const decimals = number('ERC20 Token decimal', 18, { min: 1, step: 1 })
    const erc20name = text('ERC20 Token name', 'QwQ coin')
    const erc20symbol = text('ERC20 Token symbol', 'TAT')
    return { shares, claimedAmount, message, status, decimals, erc20name, erc20symbol, total, senderName }
}

function createRecord(opts: {
    shares: number
    total: number
    message: string
    status: RedPacketStatus
    claimedAmount: number
    senderName: string
    type: EthereumTokenType
    token?: NonNullable<RedPacketRecord['payload']>['token']
}): RedPacketRecord {
    const x: RedPacketRecord = {
        id: 'id',
        from: 'https://g.cn/',
        rpid: 'rpid',
        payload: { token: opts.token } as RedPacketJSONPayload,
    }
    // @ts-ignore
    if (opts.total === 0) delete x.send_total
    // @ts-ignore
    if (opts.shares === 0) delete x.shares
    return x
}
