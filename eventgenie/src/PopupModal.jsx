import React from 'react';

const PopupModal = ({ isOpen, message, type = 'info', onClose }) => {
    if (!isOpen) return null;

    const getModalStyle = () => {
        const baseStyle = {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        };
        return baseStyle;
    };

    const getContentStyle = () => {
        const baseStyle = {
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
        };

        // Add color based on type
        switch (type) {
            case 'success':
                baseStyle.borderLeft = '4px solid #28a745';
                break;
            case 'error':
                baseStyle.borderLeft = '4px solid #dc3545';
                break;
            case 'warning':
                baseStyle.borderLeft = '4px solid #ffc107';
                break;
            default:
                baseStyle.borderLeft = '4px solid #17a2b8';
        }

        return baseStyle;
    };

    const getIconStyle = () => {
        const baseStyle = {
            fontSize: '3rem',
            marginBottom: '16px'
        };

        switch (type) {
            case 'success':
                baseStyle.color = '#28a745';
                break;
            case 'error':
                baseStyle.color = '#dc3545';
                break;
            case 'warning':
                baseStyle.color = '#ffc107';
                break;
            default:
                baseStyle.color = '#17a2b8';
        }

        return baseStyle;
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return 'fas fa-check-circle';
            case 'error':
                return 'fas fa-exclamation-circle';
            case 'warning':
                return 'fas fa-exclamation-triangle';
            default:
                return 'fas fa-info-circle';
        }
    };

    return (
        <div style={getModalStyle()} onClick={onClose}>
            <div style={getContentStyle()} onClick={(e) => e.stopPropagation()}>
                <i className={getIcon()} style={getIconStyle()}></i>
                <h3 style={{
                    margin: '0 0 12px 0',
                    color: '#333',
                    fontSize: '1.2rem'
                }}>
                    {type === 'success' && 'Success!'}
                    {type === 'error' && 'Error!'}
                    {type === 'warning' && 'Warning!'}
                    {type === 'info' && 'Information'}
                </h3>
                <p style={{
                    margin: '0 0 20px 0',
                    color: '#666',
                    lineHeight: '1.5'
                }}>
                    {message}
                </p>
                <button
                    onClick={onClose}
                    style={{
                        background: type === 'success' ? '#28a745' :
                            type === 'error' ? '#dc3545' :
                                type === 'warning' ? '#ffc107' : '#17a2b8',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.opacity = '0.8'}
                    onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                    OK
                </button>
            </div>
        </div>
    );
};

export default PopupModal; 