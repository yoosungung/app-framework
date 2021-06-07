import poplib
from email.parser import BytesParser
from email.policy import default
from email.errors import MessageError

poplib._MAXLINE = 20480

def connect_pop3():
    conpop3 = poplib.POP3_SSL('pop3.sample.com', 995)
    conpop3.user('user@domain.com')
    conpop3.pass_('password')

    return conpop3

def start():
    server = connect_pop3()
    server.list(10)
    (numMsgs, totalSize) = server.stat()
    
    for i in range(numMsgs-1, numMsgs-5, -1):
        (state, lines, octets) = server.retr(i)
        if(state == b'+OK '):
            msg_byte = b'\r\n'.join(lines)
            try:
                msg = BytesParser(policy=default).parsebytes(msg_byte)

                print(msg['message-id'])

                print(msg['from'])
                print(msg['to'])
                print(msg['cc'])
                print(msg['bcc'])

                print(msg['date'])

                print(msg['subject'])

                #print(msg.get_body())

                for part in msg.iter_attachments():
                    print(part.get_content_type())
                    print(part.get_filename())
                    # print(part.get_content())
            except MessageError:
                print(MessageError)
                pass

        else:
            print("Error %d:" % i)
        print('--------------------------------------')

    server.quit()

start()
